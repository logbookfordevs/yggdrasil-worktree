import chalk from 'chalk';
import inquirer from 'inquirer';
import { listWorktrees, removeWorktree, getRepoRoot, getLastActivity } from '../../lib/git.js';
import { getManagedWorktreesRoot } from '../../lib/global-config.js';
import { log, createSpinner, timeAgo } from '../../lib/ui.js';
import {
    detectWorktreeType,
    formatWorktreeDisplayPath,
    formatWorktreeType,
    getWorktreeBranchName,
    isManagedWorktreePath,
} from '../../lib/worktree.js';

export async function deleteCommand(options: { all?: boolean } = {}) {
    try {
        const currentWorktreePath = await getRepoRoot();
        const worktrees = await listWorktrees();
        const managedRoot = await getManagedWorktreesRoot();
        let showAll = options.all;
        if (showAll === undefined) {
            const { includeExternal } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'includeExternal',
                    message: 'Include external linked worktrees (outside the managed root)?',
                    default: false,
                },
            ]);
            showAll = includeExternal;
        }

        const includeAll = Boolean(showAll);
        const mainWorktreePath = worktrees[0]?.path;

        const deletableWts = worktrees.filter(wt => {
            if (includeAll) {
                const isMainWorktree = wt.path === mainWorktreePath;
                const isCurrentWorktree = wt.path === currentWorktreePath;
                return !isMainWorktree && !isCurrentWorktree;
            }
            return isManagedWorktreePath(wt.path, managedRoot);
        });

        if (deletableWts.length === 0) {
            log.info(includeAll
                ? 'No deletable linked worktrees found.'
                : 'No managed worktrees found to delete. Use "yggtree wt delete --all" to include external linked worktrees.');
            return;
        }

        const choices = await Promise.all(deletableWts.map(async (wt) => {
            const [activity, type] = await Promise.all([
                getLastActivity(wt.path),
                detectWorktreeType(wt, mainWorktreePath || '', managedRoot),
            ]);
            const branchName = getWorktreeBranchName(wt);
            const active = activity ? chalk.magenta(timeAgo(activity)) : chalk.dim('—');
            const displayPath = formatWorktreeDisplayPath(wt.path, managedRoot);
            return {
                name: `${formatWorktreeType(type)} ${chalk.bold.yellow(branchName)} ${chalk.dim('·')} ${active} ${chalk.dim('·')} ${chalk.dim(displayPath)}`,
                value: wt.path,
            };
        }));

        const { selectedPaths } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selectedPaths',
                message: includeAll ? 'Select worktrees to delete:' : 'Select managed worktrees to delete:',
                choices: choices,
                pageSize: 10,
            },
        ]);

        if (!selectedPaths || selectedPaths.length === 0) {
            log.info('No worktrees selected.');
            return;
        }

        const count = selectedPaths.length;
        const names = selectedPaths.map((p: string) => formatWorktreeDisplayPath(p, managedRoot));

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
            const worktreeName = formatWorktreeDisplayPath(wtPath, managedRoot);
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
