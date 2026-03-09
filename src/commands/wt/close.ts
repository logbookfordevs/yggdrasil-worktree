import inquirer from 'inquirer';
import chalk from 'chalk';
import { listWorktrees, removeWorktree, getRepoRoot } from '../../lib/git.js';
import { log, createSpinner } from '../../lib/ui.js';
import {
    detectWorktreeType,
    formatWorktreeDisplayPath,
    getWorktreeBranchName,
    isManagedWorktreePath,
} from '../../lib/worktree.js';

/**
 * Terminate the parent sub-shell and exit.
 * Sends SIGHUP to the parent process (the spawned shell from `wt enter`)
 * so the user doesn't get stranded in a dead directory.
 */
function exitSubShell(): never {
    try {
        process.kill(process.ppid, 'SIGHUP');
    } catch {
        log.dim('Type "exit" to leave the sub-shell.');
    }
    process.exit(0);
}

/**
 * Close command — gracefully exit a worktree sub-shell.
 *
 * When inside an yggtree sub-shell (YGGTREE_SHELL=true), this command:
 * 1. Asks whether you want to delete the worktree you're leaving.
 * 2. If yes, removes the worktree via `git worktree remove`.
 * 3. Terminates the parent sub-shell so the user returns to their original terminal.
 *
 * Outside a sub-shell it simply informs the user.
 */
export async function closeCommand() {
    const isSubShell = process.env.YGGTREE_SHELL === 'true';

    if (!isSubShell) {
        log.info('Not inside an Yggdrasil sub-shell. Use `exit` to leave your terminal.');
        return;
    }

    try {
        const currentPath = await getRepoRoot();
        const worktrees = await listWorktrees();
        const mainWorktreePath = worktrees[0]?.path || '';

        const currentWt = worktrees.find(wt => wt.path === currentPath);

        if (!currentWt) {
            log.info('Bye! \ud83d\udc4b');
            exitSubShell();
        }

        const branchName = getWorktreeBranchName(currentWt);
        const type = await detectWorktreeType(currentWt, mainWorktreePath);
        const displayPath = formatWorktreeDisplayPath(currentWt.path);
        const isMain = type === 'MAIN';
        const isManaged = isManagedWorktreePath(currentWt.path);

        // Main worktree can't be deleted — just exit
        if (isMain) {
            log.info('Bye! \ud83d\udc4b');
            exitSubShell();
        }

        console.log('');
        log.info(`Leaving worktree: ${chalk.yellow(branchName)} ${chalk.dim(`(${displayPath})`)}`);

        const { shouldDelete } = await inquirer.prompt([{
            type: 'confirm',
            name: 'shouldDelete',
            message: `Delete this worktree before leaving?${isManaged ? '' : chalk.dim(' (external worktree \u2014 will use --force)')}`,
            default: false,
        }]);

        if (shouldDelete) {
            const { confirmDelete } = await inquirer.prompt([{
                type: 'confirm',
                name: 'confirmDelete',
                message: `Are you sure? This will remove ${chalk.bold.yellow(branchName)} at ${chalk.cyan(displayPath)}.`,
                default: false,
            }]);

            if (confirmDelete) {
                const spinner = createSpinner(`Deleting ${displayPath}...`).start();
                try {
                    await removeWorktree(currentWt.path);
                    spinner.succeed(`Deleted worktree: ${displayPath}`);
                } catch (e: any) {
                    spinner.fail(`Failed to delete ${displayPath}`);
                    log.actionableError(e.message, `git worktree remove ${currentWt.path} --force`, currentWt.path, [
                        `Try running manually: git worktree remove ${currentWt.path} --force`,
                        'Check if any files in the worktree are open or locked',
                        'Try running yggtree wt prune to clean up git metadata',
                    ]);
                }
            } else {
                log.info('Deletion cancelled.');
            }
        }

        log.info('Bye! \ud83d\udc4b');
        exitSubShell();

    } catch (error: any) {
        log.error(error.message);
        process.exit(1);
    }
}
