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

        const choices = managedWts.map(wt => ({
            name: `${chalk.bold(path.basename(wt.path))} (${chalk.dim(wt.branch || wt.HEAD)})`,
            value: wt.path,
        }));

        const { selectedPath } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedPath',
                message: 'Select worktree to delete:',
                choices: choices,
            },
        ]);

        const worktreeName = path.basename(selectedPath);

        const { confirm } = await inquirer.prompt([
            {
                type: 'input',
                name: 'confirm',
                message: `Type "${chalk.bold(worktreeName)}" to confirm deletion:`,
                validate: (input) => input === worktreeName || 'Incorrect name, deletion aborted.',
            },
        ]);

        const spinner = createSpinner(`Deleting ${worktreeName}...`).start();
        try {
            await removeWorktree(selectedPath);
            spinner.succeed(`Deleted worktree: ${worktreeName}`);
        } catch (e: any) {
            spinner.fail(`Failed to delete ${worktreeName}`);
            log.error(e.message);
        }

    } catch (error: any) {
        log.error(error.message);
        process.exit(1);
    }
}
