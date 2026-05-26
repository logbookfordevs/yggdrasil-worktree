import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, getRepoName, verifyRef, fetchAll, getCurrentBranch, ensureCorrectUpstream, publishBranch } from '../../lib/git.js';
import { runBootstrap } from '../../lib/config.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { findLocalEnvFiles, copyEnvFiles } from '../../lib/env-files.js';
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
                    // Create branch WITHOUT tracking the base, then attach worktree
                    await execa('git', ['branch', '--no-track', branchName, baseRef]);
                    await execa('git', ['worktree', 'add', wtPath, branchName]);
                }
            } catch (error: any) {
                wtSpinner.fail(`Failed to create worktree for ${branchName}.`);
                const cmd = targetBranchExists 
                    ? `git worktree add ${wtPath} ${branchName}`
                    : `git branch --no-track ${branchName} ${baseRef} && git worktree add ${wtPath} ${branchName}`;
                log.actionableError(error.message, cmd, wtPath, [
                    'Check if the folder already exists: ls ' + wtPath,
                    'Check if the branch is already used: git worktree list',
                    'Try pruning stale worktrees: yggtree wt prune',
                    `Run manually: ${cmd}`
                ]);
                continue;
            }

            // Safety net: ensure no incorrect upstream was inherited
            wtSpinner.text = `Verifying upstream safety for ${branchName}...`;
            await ensureCorrectUpstream(wtPath, branchName);

            // Auto-publish: push to origin and set correct tracking
            try {
                wtSpinner.text = `Publishing branch ${branchName}...`;
                await publishBranch(wtPath, branchName);
                wtSpinner.succeed(`Worktree for ${chalk.cyan(branchName)} created and published.`);
            } catch (error: any) {
                wtSpinner.succeed(`Worktree for ${chalk.cyan(branchName)} created (publish failed — push manually later).`);
                log.actionableError(error.message, 'git push -u origin HEAD', wtPath, [
                    `cd ${wtPath}`,
                    'Attempt to push manually: git push -u origin HEAD',
                ]);
            }
            createdWorktrees.push(wtPath);
        }

        const envFiles = await findLocalEnvFiles(repoRoot);
        if (envFiles.length > 0 && createdWorktrees.length > 0) {
            const { shouldCopyEnvFiles } = await inquirer.prompt<{ shouldCopyEnvFiles: boolean }>([
                {
                    type: 'confirm',
                    name: 'shouldCopyEnvFiles',
                    message: `Copy local env file${envFiles.length === 1 ? '' : 's'} to all created worktrees? (${envFiles.join(', ')})`,
                    default: false,
                },
            ]);

            if (shouldCopyEnvFiles) {
                for (const wtPath of createdWorktrees) {
                    await copyEnvFiles(repoRoot, wtPath, envFiles);
                }
            } else {
                log.dim('Skipped local env files.');
            }
        }

        // 4. Bootstrap
        if (shouldBootstrap) {
            for (const wtPath of createdWorktrees) {
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
