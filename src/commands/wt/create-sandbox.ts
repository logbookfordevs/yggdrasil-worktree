import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, getRepoName, getCurrentBranch } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { generateSandboxName, writeSandboxMeta } from '../../lib/sandbox.js';
import {
    buildAgentExecCommand,
    detectInstalledOpenTools,
    isAgentTool,
    launchOpenTool,
    promptOpenToolSelection,
} from './open.js';
import { execa } from 'execa';
import { spawn } from 'child_process';
import fs from 'fs-extra';

interface SandboxCreateOptions {
    bootstrap?: boolean;
    enter?: boolean;
    exec?: string;
    carry?: boolean;
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
                name: 'carry',
                message: 'Carry uncommitted changes to sandbox?',
                default: true,
                when: options.carry === undefined,
            },
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
                type: 'confirm',
                name: 'shouldOpenTool',
                message: 'Open a tool after creation? (IDE or agent CLI)',
                default: false,
                when: options.exec === undefined,
            },
        ]);

        const shouldCarry = options.carry !== undefined ? options.carry : answers.carry;
        const shouldEnter = options.enter !== undefined ? options.enter : answers.shouldEnter;
        const shouldBootstrap = options.bootstrap !== undefined ? options.bootstrap : answers.bootstrap;
        let selectedTool: Awaited<ReturnType<typeof promptOpenToolSelection>> | undefined;
        if (options.exec === undefined && answers.shouldOpenTool) {
            const installedTools = await detectInstalledOpenTools();
            if (installedTools.length === 0) {
                log.warning('No IDE/agent tool detected in PATH. Skipping open step.');
            } else {
                selectedTool = await promptOpenToolSelection(installedTools, 'Select tool to open:');
            }
        }

        const execCommandStr = options.exec || (selectedTool && isAgentTool(selectedTool) ? buildAgentExecCommand(selectedTool) : undefined);

        // 4. Detect uncommitted changes before creating worktree
        let changedFiles: string[] = [];
        let submodulePaths: string[] = [];
        
        if (shouldCarry) {
            try {
                // Get list of submodules to exclude from carry
                try {
                    const { stdout: submodules } = await execa('git', ['config', '--file', '.gitmodules', '--get-regexp', 'path'], { cwd: repoRoot });
                    submodulePaths = submodules.split('\n')
                        .filter(Boolean)
                        .map(line => line.split(' ')[1])
                        .filter(Boolean);
                } catch {
                    // No submodules or .gitmodules doesn't exist
                }

                const { stdout: unstaged } = await execa('git', ['diff', '--name-only'], { cwd: repoRoot });
                const { stdout: staged } = await execa('git', ['diff', '--name-only', '--cached'], { cwd: repoRoot });
                const { stdout: untracked } = await execa('git', ['ls-files', '--others', '--exclude-standard'], { cwd: repoRoot });
                
                const allChanges = new Set([
                    ...unstaged.split('\n').filter(Boolean),
                    ...staged.split('\n').filter(Boolean),
                    ...untracked.split('\n').filter(Boolean)
                ]);
                
                // Filter out files inside submodule directories
                changedFiles = [...allChanges].filter(file => {
                    return !submodulePaths.some(subPath => file === subPath || file.startsWith(subPath + '/'));
                });
            } catch {
                // Ignore errors, proceed without carrying
            }
        }

        // 5. Create worktree
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

        // 6. Carry over uncommitted changes (excluding submodules)
        if (shouldCarry && changedFiles.length > 0) {
            spinner.text = `Carrying ${changedFiles.length} uncommitted file(s)...`;
            for (const file of changedFiles) {
                const srcFile = path.join(repoRoot, file);
                const destFile = path.join(wtPath, file);
                try {
                    if (await fs.pathExists(srcFile)) {
                        await fs.ensureDir(path.dirname(destFile));
                        await fs.copy(srcFile, destFile);
                    }
                } catch {
                    // Skip files that can't be copied
                }
            }
            log.info(`Carried ${changedFiles.length} uncommitted file(s) to sandbox.`);
            if (submodulePaths.length > 0) {
                log.dim(`Submodules excluded (will be initialized by bootstrap): ${submodulePaths.join(', ')}`);
            }
        }

        // 7. Write sandbox metadata (NO remote push for sandbox!)
        await writeSandboxMeta(wtPath, {
            originPath: repoRoot,
            originBranch: currentBranch,
            createdAt: new Date().toISOString(),
        });

        spinner.succeed(`Sandbox created: ${chalk.cyan(sandboxName)}`);
        log.dim('This is a local sandbox - no remote branch will be pushed.');

        // 8. Bootstrap
        if (shouldBootstrap) {
            await runBootstrap(wtPath, repoRoot);
        }

        // 9. Exec command
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

        if (selectedTool && !isAgentTool(selectedTool)) {
            try {
                log.info(`Opening ${ui.path(wtPath)} in ${chalk.cyan(selectedTool.name)}...`);
                await launchOpenTool(selectedTool, wtPath);
            } catch (error: any) {
                log.warning(`Could not open ${selectedTool.name}: ${error.message}`);
            }
        }

        // 10. Final output
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
