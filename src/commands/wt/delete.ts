import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { listWorktrees, removeWorktree, getRepoRoot, getLastActivity } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner, timeAgo } from '../../lib/ui.js';

export async function deleteCommand() {
    try {
        const _ = await getRepoRoot();
        const worktrees = await listWorktrees();

        // Filter only managed worktrees
        const managedWts = worktrees.filter(wt => wt.path.startsWith(WORKTREES_ROOT));

        if (managedWts.length === 0) {
            log.info('No managed worktrees found to delete.');
            return;
        }

        // Pre-fetch activity for all managed worktrees in parallel
        const activities = await Promise.all(
            managedWts.map(wt => getLastActivity(wt.path))
        );

        const choices = managedWts.map((wt, i) => {
            const branchName = wt.branch || wt.HEAD || 'detached';
            const active = activities[i] ? chalk.magenta(timeAgo(activities[i])) : chalk.dim('—');
            return {
                name: `${chalk.bold.yellow(branchName)} ${chalk.dim('·')} ${active}`,
                value: wt.path,
            };
        });

        const { selectedPaths } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selectedPaths',
                message: 'Select worktrees to delete:',
                choices: choices,
            },
        ]);

        if (!selectedPaths || selectedPaths.length === 0) {
            log.info('No worktrees selected.');
            return;
        }

        const count = selectedPaths.length;
        const names = selectedPaths.map((p: string) => path.relative(WORKTREES_ROOT, p));

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to delete ${count > 1 ? `${count} worktrees` : `"${names[0]}"`}?`,
                default: false,
            },
        ]);

        if (!confirm) {
            log.info('Deletion aborted.');
            return;
        }

        for (const wtPath of selectedPaths) {
            const worktreeName = path.relative(WORKTREES_ROOT, wtPath);
            const spinner = createSpinner(`Deleting ${worktreeName}...`).start();
            try {
                await removeWorktree(wtPath);
                spinner.succeed(`Deleted worktree: ${worktreeName}`);
            } catch (e: any) {
                spinner.fail(`Failed to delete ${worktreeName}`);
                log.actionableError(e.message, `git worktree remove ${wtPath} --force`, wtPath, [
                    `Try running manually: git worktree remove ${wtPath} --force`,
                    'Check if any files in the worktree are open or locked',
                    'Try running yggtree wt prune to clean up git metadata'
                ]);
            }
        }

    } catch (error: any) {
        log.error(error.message);
        process.exit(1);
    }
}
