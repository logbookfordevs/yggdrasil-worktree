import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { listWorktrees, getRepoRoot } from '../../lib/git.js';
import { getManagedWorktreesRoot } from '../../lib/global-config.js';
import { log } from '../../lib/ui.js';
import { runBootstrap } from '../../lib/config.js';
import { isManagedWorktreePath } from '../../lib/worktree.js';

export async function bootstrapCommand() {
    try {
        const repoRoot = await getRepoRoot();
        const worktrees = await listWorktrees();
        const managedRoot = await getManagedWorktreesRoot(repoRoot);

        // 1. Select Worktree
        // Filter managed or just show all? The prompt said "managed", let's prioritize managed but maybe allow all if needed?
        // User requirements say "managed", sticking to that for consistency.
        const managedWts = worktrees.filter(wt => isManagedWorktreePath(wt.path, managedRoot));

        if (managedWts.length === 0) {
            log.info('No managed worktrees found to bootstrap.');
            return;
        }

        const choices = managedWts.map(wt => {
            const relative = path.relative(managedRoot, wt.path);
            return {
                name: `${chalk.bold(relative)} (${chalk.dim(wt.branch || wt.HEAD)})`,
                value: wt.path,
            };
        });

        const { selectedPath } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedPath',
                message: 'Select worktree to bootstrap:',
                choices: choices,
            },
        ]);

        const wtPath = selectedPath;
        await runBootstrap(wtPath, repoRoot);

        log.success('Bootstrap completed!');

    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt bootstrap');
        process.exit(1);
    }
}
