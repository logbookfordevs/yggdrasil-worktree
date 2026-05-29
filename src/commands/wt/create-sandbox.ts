import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, getRepoName, getCurrentBranch } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { generateSandboxName, normalizeSandboxName, writeSandboxMeta } from '../../lib/sandbox.js';
import { promptAndCopyEnvFiles } from '../../lib/env-files.js';
import {
    detectInstalledOpenTools,
    launchOpenTool,
    promptOpenToolSelection,
} from './open.js';
import { execa } from 'execa';
import fs from 'fs-extra';

interface SandboxCreateOptions {
    name?: string;
    bootstrap?: boolean;
    open?: boolean;
    enter?: boolean;
    exec?: string;
    carry?: boolean;
}

export async function createSandboxCommand(options: SandboxCreateOptions = {}) {
    try {
        const repoRoot = await getRepoRoot();
        log.info(`Repo: ${chalk.dim(repoRoot)}`);

        if (options.enter !== undefined) {
            log.warning('`--enter` / `--no-enter` is deprecated. Use `--open` / `--no-open` instead.');
        }

        // 1. Auto-detect current branch (no prompt!)
        const currentBranch = await getCurrentBranch();
        if (!currentBranch) {
            log.error('Could not detect current branch. Are you in a git repository?');
            return;
        }

        log.info(`Current branch: ${chalk.cyan(currentBranch)}`);

        // 2. Build default + optional custom name validation
        const generatedSandboxName = generateSandboxName(currentBranch);
        const validateSandboxName = async (input: string): Promise<true | string> => {
            if (!input.trim()) return true;

            const normalized = normalizeSandboxName(input);
            if (!normalized) {
                return 'Please provide at least one valid character.';
            }

            try {
                await execa('git', ['check-ref-format', '--branch', normalized], { cwd: repoRoot });
                return true;
            } catch {
                return 'Sandbox name is not a valid git branch name.';
            }
        };

        // 3. Gather remaining inputs
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: `Sandbox name (optional, leave empty for auto: ${generatedSandboxName}):`,
                when: options.name === undefined,
                validate: validateSandboxName,
            },
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
                name: 'shouldOpenTool',
                message: 'Open an editor after creation?',
                default: false,
                when: options.exec === undefined && options.open === undefined && options.enter === undefined,
            },
        ]);

        const requestedSandboxName = options.name !== undefined ? options.name : answers.name || '';
        const nameValidation = await validateSandboxName(requestedSandboxName);
        if (nameValidation !== true) {
            log.error(nameValidation);
            return;
        }

        const normalizedCustomName = normalizeSandboxName(requestedSandboxName);
        const sandboxName = normalizedCustomName || generatedSandboxName;
        if (requestedSandboxName.trim() && normalizedCustomName !== requestedSandboxName.trim()) {
            log.dim(`Normalized sandbox name: ${chalk.yellow(sandboxName)}`);
        }
        log.info(`Sandbox name: ${chalk.yellow(sandboxName)}`);

        const shouldCarry = options.carry !== undefined ? options.carry : answers.carry;
        const shouldBootstrap = options.bootstrap !== undefined ? options.bootstrap : answers.bootstrap;
        const shouldOpenTool = options.open !== undefined
            ? options.open
            : options.enter !== undefined
                ? options.enter
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
        await promptAndCopyEnvFiles(repoRoot, wtPath);
        if (shouldBootstrap) {
            await runBootstrap(wtPath, repoRoot);
        }

        // 9. Exec command
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
            } catch (error: any) {
                log.warning(`Could not open ${selectedTool.name}: ${error.message}`);
            }
        }

        // 10. Final output
        log.success('Sandbox ready!');
        log.info(`Use ${chalk.cyan('yggtree wt apply')} to apply changes to origin.`);
        log.info(`Use ${chalk.cyan('yggtree wt unapply')} to undo applied changes.`);
        log.header(`cd "${wtPath}"`);

    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt create-sandbox');
        process.exit(1);
    }
}
