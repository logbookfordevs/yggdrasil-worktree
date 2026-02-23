import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, getRepoName, verifyRef, fetchAll, getCurrentBranch, ensureCorrectUpstream, publishBranch } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
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

interface NewCreateOptions {
    branch?: string;
    base?: string;
    bootstrap: boolean;
    enter?: boolean;
    source?: 'local' | 'remote';
    exec?: string;
}

export async function createCommandNew(options: NewCreateOptions) {
    try {
        const repoRoot = await getRepoRoot();
        log.info(`Repo: ${chalk.dim(repoRoot)}`);

        // 1. Gather inputs
        const currentBranch = await getCurrentBranch();
        
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'branch',
                message: 'Branch name (e.g. feat/new-thing):',
                default: options.branch,
                when: !options.branch,
                validate: (input) => input.trim().length > 0 || 'Branch name is required',
            },
            {
                type: 'input',
                name: 'base',
                message: 'Base branch name:',
                default: options.base || currentBranch,
                when: !options.base,
                validate: (input) => input.trim().length > 0 || 'Base ref is required',
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
                when: !options.base && !options.source,
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
                type: 'confirm',
                name: 'shouldOpenTool',
                message: 'Open a tool after creation? (IDE or agent CLI)',
                default: false,
                when: options.exec === undefined,
            },
        ]);

        const branchName = options.branch || answers.branch;
        let baseRef = options.base || answers.base;
        const source = options.source || answers.source;
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
        
        // Append origin/ if remote is selected and not already present
        if (!options.base && source === 'remote' && !baseRef.startsWith('origin/')) {
            baseRef = `origin/${baseRef}`;
        }
        
        // Convert branch name to slug (friendly folder name)
        // e.g. feat/new-button -> feat-new-button
        const slug = branchName.replace(/[\/\\]/g, '-').replace(/\s+/g, '-');
        const repoName = await getRepoName();
        const wtPath = path.join(WORKTREES_ROOT, repoName, slug);

        // 2. Validation
        if (!slug) throw new Error('Invalid name');
        if (!baseRef) throw new Error('Invalid base ref');

        // 3. Execution
        const spinner = createSpinner('Fetching...').start();
        await fetchAll();
        spinner.text = 'Verifying base ref...';

        const baseExists = await verifyRef(baseRef);
        if (!baseExists) {
            spinner.fail(`Base ref not found: ${baseRef}`);
            log.warning(`Tip: try checking if the branch exists on remote.`);
            return;
        }

        spinner.text = `Creating worktree at ${ui.path(wtPath)}...`;
        
        // Check if target branch already exists
        const targetBranchExists = await verifyRef(branchName);
        
        try {
            await fs.ensureDir(path.dirname(wtPath));

            if (targetBranchExists) {
                // Branch exists — just attach the worktree
                await execa('git', ['worktree', 'add', wtPath, branchName]);
            } else {
                // Create branch WITHOUT tracking the base, then attach worktree
                await execa('git', ['branch', '--no-track', branchName, baseRef]);
                await execa('git', ['worktree', 'add', wtPath, branchName]);
            }
        } catch (e: any) {
            spinner.fail('Failed to create worktree.');
            const cmd = targetBranchExists 
                ? `git worktree add ${wtPath} ${branchName}`
                : `git branch --no-track ${branchName} ${baseRef} && git worktree add ${wtPath} ${branchName}`;
            log.actionableError(e.message, cmd, wtPath, [
                'Check if the folder already exists: ls ' + wtPath,
                'Check if the branch is already used: git worktree list',
                'Try pruning stale worktrees: yggtree wt prune',
                `Run manually: ${cmd}`
            ]);
            return;
        }

        // Safety net: ensure no incorrect upstream was inherited
        spinner.text = 'Verifying upstream safety...';
        await ensureCorrectUpstream(wtPath, branchName);

        // Auto-publish: push to origin and set correct tracking
        try {
            spinner.text = 'Publishing branch...';
            await publishBranch(wtPath, branchName);
            spinner.succeed('Worktree created and branch published.');
        } catch (e: any) {
            spinner.succeed('Worktree created (publish failed — push manually later).');
            log.actionableError(e.message, 'git push -u origin HEAD', wtPath, [
                `cd ${wtPath}`,
                'Attempt to push manually: git push -u origin HEAD',
            ]);
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

        if (selectedTool && !isAgentTool(selectedTool)) {
            try {
                log.info(`Opening ${ui.path(wtPath)} in ${chalk.cyan(selectedTool.name)}...`);
                await launchOpenTool(selectedTool, wtPath);
            } catch (error: any) {
                log.warning(`Could not open ${selectedTool.name}: ${error.message}`);
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
