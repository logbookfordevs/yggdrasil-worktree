import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, verifyRef, createWorktree, fetchAll, syncSubmodules, getCurrentBranch } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { execa } from 'execa';
import { spawn } from 'child_process';
import fs from 'fs-extra';

interface NewCreateOptions {
    branch?: string;
    base?: string;
    bootstrap: boolean;
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
                choices: [
                    { name: 'Remote (origin)', value: 'remote' },
                    { name: 'Local', value: 'local' },
                ],
                default: 'remote',
                when: !options.base,
            },
            {
                type: 'confirm',
                name: 'bootstrap',
                message: 'Run bootstrap? (npm install + submodules)',
                default: true,
                when: options.bootstrap !== false,
            },
        ]);

        let shouldEnter = false;
        if (!options.branch) { 
             const finalAnswer = await inquirer.prompt([{
                type: 'confirm',
                name: 'shouldEnter',
                message: 'Do you want to enter the new worktree now?',
                default: true
            }]);
            shouldEnter = finalAnswer.shouldEnter;
        }

        const branchName = options.branch || answers.branch;
        let baseRef = options.base || answers.base;
        
        // Append origin/ if remote is selected and not already present
        if (!options.base && answers.source === 'remote' && !baseRef.startsWith('origin/')) {
            baseRef = `origin/${baseRef}`;
        }

        const shouldBootstrap = options.bootstrap === false ? false : answers.bootstrap;
        
        // Convert branch name to slug (friendly folder name)
        // e.g. feat/eng-2222-new-button -> feat-eng-2222-new-button
        const slug = branchName.replace(/[\/\\]/g, '-').replace(/\s+/g, '-');
        const wtPath = path.join(WORKTREES_ROOT, slug);

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
        // If branch doesn't exist, we create it from base
        // If it does exist, we just check it out
        const createBranchFlag = targetBranchExists ? '' : `-b ${branchName}`;
        
        try {
            await fs.ensureDir(path.dirname(wtPath));
            // slightly different logic for creating new branch vs existing
            if (targetBranchExists) {
                 await execa('git', ['worktree', 'add', wtPath, branchName]);
            } else {
                 await execa('git', ['worktree', 'add', '-b', branchName, wtPath, baseRef]);
            }
            spinner.succeed('Worktree created.');
        } catch (e: any) {
            spinner.fail('Failed to create worktree.');
            log.error(e.message);
            return;
        }

        // 4. Bootstrap
        if (shouldBootstrap) {
            log.info('Bootstrapping...');
            
            // Check for npm
            try {
                await execa('npm', ['--version']);
                const installSpinner = createSpinner('Running npm install...').start();
                try {
                    await execa('npm', ['install'], { cwd: wtPath });
                    installSpinner.succeed('Dependencies installed.');
                } catch (e: any) {
                    installSpinner.fail('npm install failed.');
                    log.error(e.message);
                }
            } catch {
                log.warning('npm not found, skipping install.');
            }

            const subSpinner = createSpinner('Syncing submodules...').start();
            try {
                await syncSubmodules(wtPath);
                subSpinner.succeed('Submodules synced.');
            } catch (e: any) {
                subSpinner.fail('Submodule sync failed.');
                log.error(e.message);
                log.warning('Tip: If auth failed, try adding your key to the agent.');
            }
        }

        // 5. Final Output
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
        log.error(error.message);
        process.exit(1);
    }
}
