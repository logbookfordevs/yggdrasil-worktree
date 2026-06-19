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

interface DeleteOptions {
    all?: boolean;
    yes?: boolean;
}

function normalizeTarget(value: string): string {
    return value.trim().toLowerCase();
}

function matchesDeleteTarget(wtPath: string, branchName: string, displayPath: string, target: string): boolean {
    const normalizedTarget = normalizeTarget(target);
    return [
        wtPath,
        branchName,
        displayPath,
        wtPath.split('/').pop() || '',
    ].some(value => normalizeTarget(value) === normalizedTarget);
}

export async function deleteCommand(targets: string[] = [], options: DeleteOptions = {}) {
    try {
        const currentWorktreePath = await getRepoRoot();
        const worktrees = await listWorktrees();
        const managedRoot = await getManagedWorktreesRoot(currentWorktreePath);
        let showAll = options.all;
        const hasExplicitTargets = targets.length > 0;
        const isNonInteractive = process.env.CI === 'true' || !process.stdin.isTTY;

        if (showAll === undefined && !hasExplicitTargets) {
            if (isNonInteractive) {
                log.error('Non-interactive delete requires worktree names or --all.');
                log.dim('Try: yggtree delete <worktree> --yes');
                return;
            }

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

        const eligibleWts = worktrees.filter(wt => {
            const isMainWorktree = wt.path === mainWorktreePath;
            const isCurrentWorktree = wt.path === currentWorktreePath;
            if (isMainWorktree || isCurrentWorktree) return false;

            if (includeAll) {
                return true;
            }
            return isManagedWorktreePath(wt.path, managedRoot);
        });

        const deletableWts = hasExplicitTargets
            ? eligibleWts.filter(wt => {
                const branchName = getWorktreeBranchName(wt);
                const displayPath = formatWorktreeDisplayPath(wt.path, managedRoot);
                return targets.some(target => matchesDeleteTarget(wt.path, branchName, displayPath, target));
            })
            : eligibleWts;

        if (deletableWts.length === 0) {
            if (hasExplicitTargets) {
                log.error(`No deletable worktrees matched: ${targets.join(', ')}`);
                log.dim(includeAll
                    ? 'Main and current worktrees are protected from deletion.'
                    : 'Use "yggtree delete --all <worktree> --yes" to include linked worktrees outside the managed root.');
                return;
            }

            log.info(includeAll
                ? 'No deletable linked worktrees found.'
                : 'No managed worktrees found to delete. Use "yggtree wt delete --all" to include external linked worktrees.');
            return;
        }

        let selectedPaths = deletableWts.map(wt => wt.path);
        const shouldPromptForSelection = !hasExplicitTargets && !(options.all === true && options.yes);

        if (shouldPromptForSelection) {
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

            const answer = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'selectedPaths',
                    message: includeAll ? 'Select worktrees to delete:' : 'Select managed worktrees to delete:',
                    choices: choices,
                    pageSize: 10,
                },
            ]);
            selectedPaths = answer.selectedPaths;
        }

        if (!selectedPaths || selectedPaths.length === 0) {
            log.info('No worktrees selected.');
            return;
        }

        const count = selectedPaths.length;
        const names = selectedPaths.map((p: string) => formatWorktreeDisplayPath(p, managedRoot));

        if (!options.yes) {
            if (isNonInteractive) {
                log.error('Non-interactive delete requires --yes.');
                log.dim(`Try: yggtree delete ${targets.join(' ')} --yes`);
                return;
            }

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
