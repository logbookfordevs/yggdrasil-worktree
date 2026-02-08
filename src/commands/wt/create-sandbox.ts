import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, getRepoName, getCurrentBranch } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { generateSandboxName, writeSandboxMeta } from '../../lib/sandbox.js';
import { execa } from 'execa';
import { spawn } from 'child_process';
import fs from 'fs-extra';

interface SandboxCreateOptions {
    bootstrap?: boolean;
    enter?: boolean;
    exec?: string;
}

export async function createSandboxCommand(options: SandboxCreateOptions = {}) {
    try {
        const repoRoot = await getRepoRoot();
        log.info(`Repo: ${chalk.dim(repoRoot)}`);

        // 1. Auto-detect current branch (no prompt!)
        const currentBranch = await getCurrentBranch();
        if (!currentBranch) {
            log.error('Could not detect current branch. Are you in a git repository?');
            return;
        }

        log.info(`Current branch: ${chalk.cyan(currentBranch)}`);

        // 2. Generate random sandbox name
        const sandboxName = generateSandboxName(currentBranch);
        log.info(`Sandbox name: ${chalk.yellow(sandboxName)}`);

        // 3. Gather remaining inputs
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'bootstrap',
                message: 'Run bootstrap? (npm install + submodules)',
                default: true,
                when: options.bootstrap === undefined,
            },
            {
                type: 'confirm',
                name: 'shouldEnter',
                message: 'Do you want to enter the sandbox now?',
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

        const shouldEnter = options.enter !== undefined ? options.enter : answers.shouldEnter;
        const shouldBootstrap = options.bootstrap !== undefined ? options.bootstrap : answers.bootstrap;
        const execCommandStr = options.exec || answers.exec;

        // 4. Create worktree
        const repoName = await getRepoName();
        const wtPath = path.join(WORKTREES_ROOT, repoName, sandboxName);

        const spinner = createSpinner('Creating sandbox worktree...').start();

        try {
            await fs.ensureDir(path.dirname(wtPath));
            // Create new branch from current HEAD (local branch)
            await execa('git', ['worktree', 'add', '-b', sandboxName, wtPath, 'HEAD']);
        } catch (e: any) {
            spinner.fail('Failed to create sandbox worktree.');
            log.actionableError(e.message, `git worktree add -b ${sandboxName} ${wtPath} HEAD`, wtPath, [
                'Check if the folder already exists: ls ' + wtPath,
                'Check if the branch is already used: git worktree list',
                'Try pruning stale worktrees: yggtree wt prune',
            ]);
            return;
        }

        // 5. Write sandbox metadata (NO remote push for sandbox!)
        await writeSandboxMeta(wtPath, {
            originPath: repoRoot,
            originBranch: currentBranch,
            createdAt: new Date().toISOString(),
        });

        spinner.succeed(`Sandbox created: ${chalk.cyan(sandboxName)}`);
        log.dim('This is a local sandbox - no remote branch will be pushed.');

        // 6. Bootstrap
        if (shouldBootstrap) {
            await runBootstrap(wtPath, repoRoot);
        }

        // 7. Exec command
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

        // 8. Final output
        log.success('Sandbox ready!');
        log.info(`Use ${chalk.cyan('yggtree wt apply')} to apply changes to origin.`);
        log.info(`Use ${chalk.cyan('yggtree wt unapply')} to undo applied changes.`);

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
        log.actionableError(error.message, 'yggtree wt create-sandbox');
        process.exit(1);
    }
}
