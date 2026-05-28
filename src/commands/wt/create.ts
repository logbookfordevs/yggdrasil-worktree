import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { GitWorktree, getRepoRoot, getRepoName, createWorktree, fetchAll, listWorktrees } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { ensureAutocompletePrompt } from '../../lib/prompt.js';
import { promptAndCopyEnvFiles } from '../../lib/env-files.js';
import { enterCommand } from './enter.js';
import {
    detectInstalledOpenTools,
    isAgentTool,
    launchOpenTool,
    promptOpenToolSelection,
} from './open.js';
import { execa } from 'execa';
import fs from 'fs-extra';

interface CreateOptions {
    name?: string;
    ref?: string;
    bootstrap?: boolean;
    open?: boolean;
    enter?: boolean;
    exec?: string;
}

interface BranchCandidate {
    branchName: string;
    checkoutRef: string;
    createLocalBranch: boolean;
    source: 'local' | 'remote';
    attachedBranchName?: string;
    sourceLabel: string;
}

function toSlug(value: string): string {
    return value
        .trim()
        .replace(/[\/\\]/g, '-')
        .replace(/\s+/g, '-');
}

export async function listBranchCandidates(): Promise<BranchCandidate[]> {
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
    const uniqueRemoteBranches = [...new Set(remoteBranches)];

    const localCandidates: BranchCandidate[] = localBranches.map(branchName => ({
        branchName,
        checkoutRef: branchName,
        createLocalBranch: false,
        source: 'local',
        attachedBranchName: branchName,
        sourceLabel: 'local',
    }));

    const remoteCandidates: BranchCandidate[] = uniqueRemoteBranches.map(branchName => ({
        branchName,
        checkoutRef: `origin/${branchName}`,
        createLocalBranch: !localSet.has(branchName),
        source: 'remote',
        attachedBranchName: localSet.has(branchName) ? undefined : branchName,
        sourceLabel: localSet.has(branchName) ? 'remote tip, detached' : 'remote, creates local branch',
    }));

    return [...localCandidates, ...remoteCandidates]
        .sort((a, b) =>
            a.branchName.localeCompare(b.branchName) ||
            a.checkoutRef.localeCompare(b.checkoutRef)
        );
}

function resolveCandidateFromRef(ref: string, candidates: BranchCandidate[]): BranchCandidate | undefined {
    const trimmedRef = ref.trim();
    if (!trimmedRef) return undefined;

    if (trimmedRef.startsWith('origin/')) {
        const branchName = trimmedRef.replace(/^origin\//, '');
        return candidates.find(candidate =>
            candidate.branchName === branchName &&
            candidate.checkoutRef === trimmedRef
        );
    }

    return candidates.find(candidate =>
        candidate.branchName === trimmedRef ||
        candidate.checkoutRef === trimmedRef
    );
}

export function findExistingBranchWorktree(worktrees: GitWorktree[], branchName?: string): GitWorktree | undefined {
    if (!branchName) return undefined;
    return worktrees.find(wt => wt.branch === branchName);
}

async function promptShouldEnterShell(message: string): Promise<boolean> {
    const { shouldEnterShell } = await inquirer.prompt<{ shouldEnterShell: boolean }>([
        {
            type: 'confirm',
            name: 'shouldEnterShell',
            message,
            default: true,
        },
    ]);

    return shouldEnterShell;
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
                            ? candidates.filter(candidate =>
                                candidate.branchName.toLowerCase().includes(term) ||
                                candidate.checkoutRef.toLowerCase().includes(term)
                            )
                            : candidates;

                        return filtered.map(candidate => ({
                            name: `${chalk.yellow(candidate.checkoutRef)} ${chalk.dim(`(${candidate.sourceLabel})`)}`,
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
        const existingBranchWorktree = findExistingBranchWorktree(existingWorktrees, selectedBranch.attachedBranchName);

        if (existingBranchWorktree) {
            log.info(
                `Branch ${chalk.cyan(selectedBranch.branchName)} is already active in ${ui.path(existingBranchWorktree.path)}.`
            );

            if (options.exec && options.exec.trim()) {
                log.info('Reusing the existing worktree and running the requested command...');
                await enterCommand(existingBranchWorktree.path, { exec: options.exec });
                return;
            }

            const shouldOpenExisting = options.open !== undefined
                ? options.open
                : (await inquirer.prompt([
                        {
                            type: 'confirm',
                            name: 'shouldOpenTool',
                            message: 'Open a tool in the existing worktree now? (IDE or agent CLI)',
                            default: true,
                        },
                    ])).shouldOpenTool;

            if (!shouldOpenExisting) {
                const shouldEnterExisting = options.enter !== undefined
                    ? options.enter
                    : await promptShouldEnterShell('Enter the existing worktree shell now?');

                if (shouldEnterExisting) {
                    await enterCommand(existingBranchWorktree.path);
                    return;
                }
                log.header(`cd "${existingBranchWorktree.path}"`);
                return;
            }

            const installedTools = await detectInstalledOpenTools();
            if (installedTools.length === 0) {
                log.warning('No IDE/agent tool detected in PATH. Skipping open step.');
                const shouldEnterExisting = options.enter !== undefined
                    ? options.enter
                    : await promptShouldEnterShell('Enter the existing worktree shell now?');
                if (shouldEnterExisting) {
                    await enterCommand(existingBranchWorktree.path);
                    return;
                }
                log.header(`cd "${existingBranchWorktree.path}"`);
                return;
            }

            const selectedTool = await promptOpenToolSelection(installedTools, 'Select tool to open in the existing worktree:');
            log.info('Opening existing worktree instead of creating a duplicate...');
            await launchOpenTool(selectedTool, existingBranchWorktree.path);
            const shouldEnterExisting = options.enter !== undefined
                ? options.enter
                : !isAgentTool(selectedTool) && await promptShouldEnterShell('Enter the existing worktree shell too?');
            if (shouldEnterExisting && !isAgentTool(selectedTool)) {
                await enterCommand(existingBranchWorktree.path);
            }
            log.success('Existing worktree opened.');
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
                name: 'shouldOpenTool',
                message: 'Open a tool after creation? (IDE or agent CLI)',
                default: false,
                when: options.exec === undefined && options.open === undefined,
            },
        ]);

        const name = options.name || answers.name;
        const shouldBootstrap = options.bootstrap !== undefined ? options.bootstrap : answers.bootstrap;
        const shouldOpenTool = options.open !== undefined
            ? options.open
            : Boolean(answers.shouldOpenTool);
        let selectedTool: Awaited<ReturnType<typeof promptOpenToolSelection>> | undefined;
        if (options.exec === undefined && shouldOpenTool) {
            const installedTools = await detectInstalledOpenTools();
            if (installedTools.length === 0) {
                log.warning('No IDE/agent tool detected in PATH. Skipping open step.');
            } else {
                selectedTool = await promptOpenToolSelection(installedTools, 'Select tool to open:');
            }
        }

        const shouldEnterShell = options.exec === undefined
            ? options.enter !== undefined
                ? options.enter
                : !(selectedTool && isAgentTool(selectedTool)) && await promptShouldEnterShell('Enter the worktree shell after checkout?')
            : false;
        
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

        await promptAndCopyEnvFiles(repoRoot, wtPath);
        if (shouldBootstrap) {
            await runBootstrap(wtPath, repoRoot);
        }

        // 6. Exec Command
        if (options.exec && options.exec.trim()) {
            log.info(`Executing: ${options.exec} in ${ui.path(wtPath)}`);
            try {
                await execa(options.exec, {
                    cwd: wtPath,
                    stdio: 'inherit',
                    shell: true
                });
            } catch (error: any) {
                log.actionableError(error.message, options.exec, wtPath, [
                    `cd ${wtPath} && ${options.exec}`,
                    'Check your command syntax and environment variables'
                ]);
            }
        } else if (selectedTool) {
            try {
                log.info(`Opening ${ui.path(wtPath)} in ${chalk.cyan(selectedTool.name)}...`);
                await launchOpenTool(selectedTool, wtPath);
                if (shouldEnterShell && !isAgentTool(selectedTool)) {
                    await enterCommand(wtPath);
                }
            } catch (error: any) {
                log.warning(`Could not open ${selectedTool.name}: ${error.message}`);
            }
        } else if (shouldEnterShell) {
            await enterCommand(wtPath);
        }

        // 7. Final Output
        log.success('Worktree ready!');
        log.header(`cd "${wtPath}"`);

    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt worktree-checkout');
        process.exit(1);
    }
}
