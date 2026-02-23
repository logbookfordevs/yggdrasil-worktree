import chalk from 'chalk';
import inquirer from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';
import path from 'path';
import { getRepoRoot, getRepoName, createWorktree, fetchAll, listWorktrees } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { enterCommand } from './enter.js';
import { execa } from 'execa';
import { spawn } from 'child_process';
import fs from 'fs-extra';

interface CreateOptions {
    name?: string;
    ref?: string;
    bootstrap?: boolean;
    enter?: boolean;
    exec?: string;
}

interface BranchCandidate {
    branchName: string;
    checkoutRef: string;
    createLocalBranch: boolean;
    source: 'local' | 'remote';
}

let autocompleteRegistered = false;

function ensureAutocompletePrompt() {
    if (!autocompleteRegistered) {
        inquirer.registerPrompt('autocomplete', autocompletePrompt as any);
        autocompleteRegistered = true;
    }
}

function toSlug(value: string): string {
    return value
        .trim()
        .replace(/[\/\\]/g, '-')
        .replace(/\s+/g, '-');
}

async function listBranchCandidates(): Promise<BranchCandidate[]> {
    const [localRefs, remoteRefs] = await Promise.all([
        execa('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads']),
        execa('git', ['for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin']),
    ]);

    const localBranches = localRefs.stdout
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    const remoteBranches = remoteRefs.stdout
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .filter(ref => ref !== 'origin/HEAD' && !ref.endsWith('/HEAD'))
        .map(ref => ref.replace(/^origin\//, ''));

    const localSet = new Set(localBranches);
    const remoteOnly = [...new Set(remoteBranches)].filter(branch => !localSet.has(branch));

    const localCandidates: BranchCandidate[] = localBranches.map(branchName => ({
        branchName,
        checkoutRef: branchName,
        createLocalBranch: false,
        source: 'local',
    }));

    const remoteCandidates: BranchCandidate[] = remoteOnly.map(branchName => ({
        branchName,
        checkoutRef: `origin/${branchName}`,
        createLocalBranch: true,
        source: 'remote',
    }));

    return [...localCandidates, ...remoteCandidates]
        .sort((a, b) => a.branchName.localeCompare(b.branchName));
}

function resolveCandidateFromRef(ref: string, candidates: BranchCandidate[]): BranchCandidate | undefined {
    const trimmedRef = ref.trim();
    if (!trimmedRef) return undefined;

    if (trimmedRef.startsWith('origin/')) {
        const branchName = trimmedRef.replace(/^origin\//, '');
        return candidates.find(candidate => candidate.branchName === branchName);
    }

    return candidates.find(candidate =>
        candidate.branchName === trimmedRef ||
        candidate.checkoutRef === trimmedRef
    );
}

export async function createCommand(options: CreateOptions) {
    try {
        const repoRoot = await getRepoRoot();
        log.info(`Repo: ${chalk.dim(repoRoot)}`);

        // 1. Load branches
        const loadingSpinner = createSpinner('Fetching branches...').start();
        await fetchAll();
        const candidates = await listBranchCandidates();

        if (candidates.length === 0) {
            loadingSpinner.fail('No branches found.');
            log.warning('Create a branch first, then run worktree-checkout again.');
            return;
        }

        loadingSpinner.succeed(`Loaded ${candidates.length} branches.`);

        // 2. Select branch
        ensureAutocompletePrompt();

        let selectedBranch: BranchCandidate | undefined;

        if (options.ref) {
            selectedBranch = resolveCandidateFromRef(options.ref, candidates);
            if (!selectedBranch) {
                log.error(`Branch "${options.ref}" not found.`);
                log.warning('Tip: use a local branch name or origin/<branch>.');
                return;
            }
        } else {
            const { branchChoice } = await inquirer.prompt<{ branchChoice: BranchCandidate }>([
                {
                    type: 'autocomplete',
                    name: 'branchChoice',
                    message: 'Select branch (type to filter):',
                    source: async (_answers: unknown, input = '') => {
                        const term = input.trim().toLowerCase();
                        const filtered = term
                            ? candidates.filter(candidate => candidate.branchName.toLowerCase().includes(term))
                            : candidates;

                        return filtered.map(candidate => ({
                            name: `${chalk.yellow(candidate.branchName)} ${chalk.dim(`(${candidate.source})`)}`,
                            value: candidate,
                        }));
                    },
                    pageSize: 10,
                } as any,
            ]);

            selectedBranch = branchChoice;
        }

        if (!selectedBranch) {
            log.error('No branch selected.');
            return;
        }

        const existingWorktrees = await listWorktrees();
        const existingManagedWorktree = existingWorktrees.find(
            wt => wt.branch === selectedBranch.branchName && wt.path.startsWith(WORKTREES_ROOT)
        );

        if (existingManagedWorktree) {
            log.info(
                `Branch ${chalk.cyan(selectedBranch.branchName)} is already active in ${ui.path(existingManagedWorktree.path)}.`
            );

            if (options.enter === false) {
                log.header(`cd "${existingManagedWorktree.path}"`);
                return;
            }

            log.info('Opening existing worktree instead of creating a duplicate...');
            await enterCommand(existingManagedWorktree.path, { exec: options.exec });
            return;
        }

        // 3. Gather remaining inputs
        const defaultSlug = toSlug(selectedBranch.branchName);

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Worktree name (slug):',
                default: options.name || defaultSlug,
                when: !options.name,
                validate: (input) => input.trim().length > 0 || 'Name is required',
            },
            {
                type: 'confirm',
                name: 'bootstrap',
                message: 'Run bootstrap? (npm install + submodules)',
                default: true,
                when: options.bootstrap !== false && options.bootstrap !== true,
            },
            {
                type: 'confirm',
                name: 'shouldEnter',
                message: 'Do you want to enter the new worktree now?',
                default: true,
                when: options.enter === undefined,
            },
            {
                type: 'input',
                name: 'exec',
                message: 'Command to run after creation (optional):',
                default: options.exec,
                when: options.exec === undefined,
            }
        ]);

        const name = options.name || answers.name;
        const shouldEnter = options.enter !== undefined ? options.enter : answers.shouldEnter;
        const shouldBootstrap = options.bootstrap !== undefined ? options.bootstrap : answers.bootstrap;
        const execCommandStr = options.exec || answers.exec;
        
        const slug = toSlug(name);
        const repoName = await getRepoName();
        const wtPath = path.join(WORKTREES_ROOT, repoName, slug);

        // 4. Validation
        if (!slug) throw new Error('Invalid name');

        // 5. Execution (checkout-style: attach to selected branch)
        const spinner = createSpinner(`Creating worktree at ${ui.path(wtPath)}...`).start();
        try {
            await fs.ensureDir(path.dirname(wtPath));
            if (selectedBranch.createLocalBranch) {
                await execa('git', ['worktree', 'add', '-b', selectedBranch.branchName, wtPath, selectedBranch.checkoutRef]);
            } else {
                await createWorktree(wtPath, selectedBranch.checkoutRef);
            }
            spinner.succeed('Worktree created.');
        } catch (e: any) {
            spinner.fail('Failed to create worktree.');
            const command = selectedBranch.createLocalBranch
                ? `git worktree add -b ${selectedBranch.branchName} ${wtPath} ${selectedBranch.checkoutRef}`
                : `git worktree add ${wtPath} ${selectedBranch.checkoutRef}`;
            log.actionableError(e.message, command, wtPath, [
                'Check if the folder already exists: ls ' + wtPath,
                `Check if branch "${selectedBranch.branchName}" is already checked out in another worktree: git worktree list`,
                'Try pruning stale worktrees: yggtree wt prune',
                `Run manually: ${command}`
            ]);
            return;
        }

        if (shouldBootstrap) {
            await runBootstrap(wtPath, repoRoot);
        }

        // 6. Exec Command
        if (execCommandStr && execCommandStr.trim()) {
            log.info(`Executing: ${execCommandStr} in ${ui.path(wtPath)}`);
            try {
                await execa(execCommandStr, {
                    cwd: wtPath,
                    stdio: 'inherit',
                    shell: true
                });
            } catch (error: any) {
                log.actionableError(error.message, execCommandStr, wtPath, [
                    `cd ${wtPath} && ${execCommandStr}`,
                    'Check your command syntax and environment variables'
                ]);
            }
        }

        // 7. Final Output
        log.success('Worktree ready!');
        
        if (shouldEnter) {
            log.info(`Spawning sub-shell in ${ui.path(wtPath)}...`);
            log.dim('Type "exit" to return to the main terminal.');
            
            const shell = process.env.SHELL || 'zsh';
            const child = spawn(shell, [], {
                cwd: wtPath,
                stdio: 'inherit',
            });

            child.on('close', () => {
                log.info('Exited sub-shell.');
            });
        } else {
            log.header(`cd "${wtPath}"`);
        }

    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt worktree-checkout');
        process.exit(1);
    }
}
