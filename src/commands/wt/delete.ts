import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { listWorktrees, removeWorktree, getRepoRoot } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';

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

        const choices = managedWts.map(wt => {
            const relative = path.relative(WORKTREES_ROOT, wt.path);
            return {
                name: `${chalk.bold(relative)} (${chalk.dim(wt.branch || wt.HEAD)})`,
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
                log.error(e.message);
            }
        }

    } catch (error: any) {
        log.error(error.message);
        process.exit(1);
    }
}
