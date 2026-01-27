import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, verifyRef, fetchAll, syncSubmodules, getCurrentBranch } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { execa } from 'execa';
import fs from 'fs-extra';

interface MultiCreateOptions {
    base?: string;
    bootstrap: boolean;
}

export async function createCommandMulti(options: MultiCreateOptions) {
    try {
        const repoRoot = await getRepoRoot();
        log.info(`Repo: ${chalk.dim(repoRoot)}`);

        // 1. Gather inputs
        const currentBranch = await getCurrentBranch();
        
        const answers = await inquirer.prompt([
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
                when: !options.base,
            },
            {
                type: 'input',
                name: 'branches',
                message: 'Enter branch names (separated by space):',
                validate: (input) => input.trim().length > 0 || 'At least one branch name is required',
            },
            {
                type: 'confirm',
                name: 'bootstrap',
                message: 'Run bootstrap for all worktrees? (npm install + submodules)',
                default: true,
                when: options.bootstrap !== false,
            },
        ]);

        let baseRef = options.base || answers.base;
        if (!options.base && answers.source === 'remote' && !baseRef.startsWith('origin/')) {
            baseRef = `origin/${baseRef}`;
        }

        const branchNames = answers.branches.split(/\s+/).filter((b: string) => b.length > 0);
        const shouldBootstrap = options.bootstrap === false ? false : answers.bootstrap;

        // 2. Validation of base ref
        const spinner = createSpinner('Fetching...').start();
        await fetchAll();
        spinner.text = 'Verifying base ref...';

        const baseExists = await verifyRef(baseRef);
        if (!baseExists) {
            spinner.fail(`Base ref not found: ${baseRef}`);
            return;
        }
        spinner.succeed(`Base ref ${chalk.cyan(baseRef)} verified.`);

        const createdWorktrees: string[] = [];

        // 3. Execution for each branch
        for (const branchName of branchNames) {
            const slug = branchName.replace(/[\/\\]/g, '-').replace(/\s+/g, '-');
            const wtPath = path.join(WORKTREES_ROOT, slug);

            log.header(`Processing: ${branchName}`);
            const wtSpinner = createSpinner(`Creating worktree at ${ui.path(wtPath)}...`).start();

            try {
                // Check if target branch already exists
                const targetBranchExists = await verifyRef(branchName);
                
                await fs.ensureDir(path.dirname(wtPath));
                
                if (targetBranchExists) {
                    await execa('git', ['worktree', 'add', wtPath, branchName]);
                } else {
                    await execa('git', ['worktree', 'add', '-b', branchName, wtPath, baseRef]);
                }
                
                wtSpinner.succeed(`Worktree for ${chalk.cyan(branchName)} created.`);
                createdWorktrees.push(wtPath);

                // 4. Bootstrap
                if (shouldBootstrap) {
                    log.info(`Bootstrapping ${branchName}...`);
                    
                    // Check for npm
                    try {
                        await execa('npm', ['--version']);
                        const installSpinner = createSpinner('Running npm install...').start();
                        try {
                            await execa('npm', ['install'], { cwd: wtPath });
                            installSpinner.succeed('Dependencies installed.');
                        } catch (e: any) {
                            installSpinner.fail('npm install failed.');
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
                    }
                }
            } catch (error: any) {
                wtSpinner.fail(`Failed to create worktree for ${branchName}.`);
                log.error(error.message);
            }
        }

        // 5. Final Output
        log.success(`${createdWorktrees.length} worktrees ready!`);
        if (createdWorktrees.length > 0) {
            log.info('You can access them with:');
            createdWorktrees.forEach(wtPath => {
                log.header(`cd "${wtPath}"`);
            });
        }

    } catch (error: any) {
        log.error(error.message);
        process.exit(1);
    }
}
