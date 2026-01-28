import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, getRepoName, verifyRef, fetchAll, getCurrentBranch, ensureCorrectUpstream } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { execa } from 'execa';
import fs from 'fs-extra';

interface MultiCreateOptions {
    base?: string;
    bootstrap: boolean;
    source?: 'local' | 'remote';
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
                when: !options.base && !options.source,
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
                when: options.bootstrap !== false && options.bootstrap !== true,
            }
        ]);

        const baseRefRaw = options.base || answers.base;
        const source = options.source || answers.source;

        let baseRef = baseRefRaw;
        if (!options.base && source === 'remote' && !baseRef.startsWith('origin/')) {
            baseRef = `origin/${baseRef}`;
        }

        const branchNames = answers.branches.split(/\s+/).filter((b: string) => b.length > 0);
        const shouldBootstrap = options.bootstrap !== undefined ? options.bootstrap : answers.bootstrap;

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
        const repoName = await getRepoName();
        for (const branchName of branchNames) {
            const slug = branchName.replace(/[\/\\]/g, '-').replace(/\s+/g, '-');
            const wtPath = path.join(WORKTREES_ROOT, repoName, slug);

            log.header(`Processing: ${branchName}`);
            const wtSpinner = createSpinner(`Creating worktree at ${ui.path(wtPath)}...`).start();

            // Check if target branch already exists
            const targetBranchExists = await verifyRef(branchName);

            try {
                await fs.ensureDir(path.dirname(wtPath));
                
                if (targetBranchExists) {
                    await execa('git', ['worktree', 'add', wtPath, branchName]);
                } else {
                    await execa('git', ['worktree', 'add', '-b', branchName, wtPath, baseRef]);
                }
            } catch (error: any) {
                wtSpinner.fail(`Failed to create worktree for ${branchName}.`);
                const cmd = targetBranchExists 
                    ? `git worktree add ${wtPath} ${branchName}`
                    : `git worktree add -b ${branchName} ${wtPath} ${baseRef}`;
                log.actionableError(error.message, cmd, wtPath, [
                    'Check if the folder already exists: ls ' + wtPath,
                    'Check if the branch is already used: git worktree list',
                    'Try pruning stale worktrees: yggtree wt prune',
                    `Run manually: ${cmd}`
                ]);
                continue;
            }

            try {
                // Strong Safety Mode: Ensure upstream is origin/<branchName> and publish
                wtSpinner.text = `Safely publishing branch ${branchName}...`;
                await ensureCorrectUpstream(wtPath, branchName);
                
                wtSpinner.succeed(`Worktree for ${chalk.cyan(branchName)} created and published.`);
                createdWorktrees.push(wtPath);
            } catch (error: any) {
                wtSpinner.fail(`Worktree for ${branchName} created, but publication failed.`);
                log.actionableError(error.message, 'git push -u origin HEAD', wtPath, [
                    `cd ${wtPath}`,
                    'Attempt to push manually: git push -u origin HEAD',
                    'Check if the remote branch already exists or if you have push permissions'
                ]);
                createdWorktrees.push(wtPath); // Still added to list since wt exists
            }

            // 4. Bootstrap
            if (shouldBootstrap) {
                await runBootstrap(wtPath, repoRoot);
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
        log.actionableError(error.message, 'yggtree wt create-multi');
        process.exit(1);
    }
}
