import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { listWorktrees, removeWorktree, getRepoRoot, getLastActivity } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, createSpinner, timeAgo } from '../../lib/ui.js';
import { getSandboxMetaPath } from '../../lib/sandbox.js';

export async function deleteCommand(options: { all?: boolean } = {}) {
    try {
        const currentWorktreePath = await getRepoRoot();
        const worktrees = await listWorktrees();
        let showAll = options.all;
        if (showAll === undefined) {
            const { includeExternal } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'includeExternal',
                    message: 'Include external linked worktrees (outside ~/.yggtree)?',
                    default: false,
                },
            ]);
            showAll = includeExternal;
        }

        const includeAll = Boolean(showAll);
        const mainWorktreePath = worktrees[0]?.path;

        const formatWorktreePath = (wtPath: string) =>
            wtPath.startsWith(WORKTREES_ROOT)
                ? path.relative(WORKTREES_ROOT, wtPath)
                : wtPath.replace(process.env.HOME || '', '~');

        const deletableWts = worktrees.filter(wt => {
            if (includeAll) {
                const isMainWorktree = wt.path === mainWorktreePath;
                const isCurrentWorktree = wt.path === currentWorktreePath;
                return !isMainWorktree && !isCurrentWorktree;
            }
            return wt.path.startsWith(WORKTREES_ROOT);
        });

        if (deletableWts.length === 0) {
            log.info(includeAll
                ? 'No deletable linked worktrees found.'
                : 'No managed worktrees found to delete. Use "yggtree wt delete --all" to include external linked worktrees.');
            return;
        }

        const choices = await Promise.all(deletableWts.map(async (wt) => {
            const isManaged = wt.path.startsWith(WORKTREES_ROOT);
            const [activity, hasSandboxMeta] = await Promise.all([
                getLastActivity(wt.path),
                fs.pathExists(getSandboxMetaPath(wt.path)),
            ]);

            const isSandboxBranch = (wt.branch || '').startsWith('sandbox-');
            const isSandbox = isManaged && (hasSandboxMeta || isSandboxBranch);

            const type = isSandbox
                ? chalk.magenta('SANDBOX')
                : isManaged
                    ? chalk.green('MANAGED')
                    : chalk.cyan('LINKED ');

            const branchName = wt.branch || wt.HEAD || 'detached';
            const active = activity ? chalk.magenta(timeAgo(activity)) : chalk.dim('—');
            const displayPath = formatWorktreePath(wt.path);
            return {
                name: `${type} ${chalk.bold.yellow(branchName)} ${chalk.dim('·')} ${active} ${chalk.dim('·')} ${chalk.dim(displayPath)}`,
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
        const names = selectedPaths.map((p: string) => formatWorktreePath(p));

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
            const worktreeName = formatWorktreePath(wtPath);
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
