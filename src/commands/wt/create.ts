import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, getRepoName, verifyRef, createWorktree, fetchAll, getCurrentBranch } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { execa } from 'execa';
import { spawn } from 'child_process';
import fs from 'fs-extra';

interface CreateOptions {
    name?: string;
    ref?: string;
    bootstrap: boolean;
    enter?: boolean;
    source?: 'local' | 'remote';
    exec?: string;
}

export async function createCommand(options: CreateOptions) {
    try {
        const repoRoot = await getRepoRoot();
        log.info(`Repo: ${chalk.dim(repoRoot)}`);

        // 1. Gather inputs
        const currentBranch = await getCurrentBranch();
        
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Worktree name (slug):',
                default: options.name,
                when: !options.name,
                validate: (input) => input.trim().length > 0 || 'Name is required',
            },
            {
                type: 'input',
                name: 'ref',
                message: 'Base branch name:',
                default: options.ref || currentBranch,
                when: !options.ref,
                validate: (input) => input.trim().length > 0 || 'Ref is required',
            },
            {
                type: 'list',
                name: 'source',
                message: 'Base on:',
                loop: false,
                choices: [
                    { name: 'Remote (origin)', value: 'remote' },
                    { name: 'Local', value: 'local' },
                ],
                default: 'remote',
                when: !options.ref && !options.source,
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
        let ref = options.ref || answers.ref;
        const source = options.source || answers.source;
        const shouldEnter = options.enter !== undefined ? options.enter : answers.shouldEnter;
        const shouldBootstrap = options.bootstrap !== undefined ? options.bootstrap : answers.bootstrap;
        const execCommandStr = options.exec || answers.exec;

        // Append origin/ if remote is selected and not already present
        if (!options.ref && source === 'remote' && !ref.startsWith('origin/')) {
            ref = `origin/${ref}`;
        }
        
        const slug = name.replace(/\s+/g, '-');
        const repoName = await getRepoName();
        const wtPath = path.join(WORKTREES_ROOT, repoName, slug);

        // 2. Validation
        if (!slug) throw new Error('Invalid name');
        if (!ref) throw new Error('Invalid ref');

        // 3. Execution
        const spinner = createSpinner('Fetching...').start();
        await fetchAll();
        spinner.text = 'Verifying ref...';

        const exists = await verifyRef(ref);
        if (!exists) {
            spinner.fail(`Ref not found: ${ref}`);
            log.warning(`Tip: try 'origin/${ref}' or check if the branch exists.`);
            return;
        }

        spinner.text = `Creating worktree at ${ui.path(wtPath)}...`;
        try {
            await fs.ensureDir(path.dirname(wtPath));
            await createWorktree(wtPath, ref);
            spinner.succeed('Worktree created.');
        } catch (e: any) {
            spinner.fail('Failed to create worktree.');
            log.actionableError(e.message, `git worktree add ${wtPath} ${ref}`, wtPath, [
                'Check if the folder already exists: ls ' + wtPath,
                'Check if the branch is already used: git worktree list',
                'Try pruning stale worktrees: yggtree wt prune',
                `Run manually: git worktree add ${wtPath} ${ref}`
            ]);
            return;
        }

        if (shouldBootstrap) {
            await runBootstrap(wtPath, repoRoot);
        }

        // 5. Exec Command
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

        // 6. Final Output
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
        log.actionableError(error.message, 'yggtree wt create');
        process.exit(1);
    }
}
