import chalk from 'chalk';
import { listWorktrees, getRepoRoot, isGitClean, getLastActivity } from '../../lib/git.js';
import { log, timeAgo } from '../../lib/ui.js';
import {
    detectWorktreeType,
    formatWorktreeType,
    getWorktreeBranchName,
    WORKTREE_TYPE_ORDER,
} from '../../lib/worktree.js';

export async function listCommand() {
    try {
        await getRepoRoot(); // Verify we are in a git repo
        const worktrees = await listWorktrees();
        const mainWorktreePath = worktrees[0]?.path || '';
        
        if (worktrees.length === 0) {
            log.info('No worktrees found.');
            return;
        }

        console.log(chalk.bold('\n  Active Worktrees:\n'));

        // Header
        console.log(`  ${chalk.dim('TYPE')}    ${chalk.dim('STATE')}    ${chalk.dim('LAST ACTIVE')}    ${chalk.dim('BRANCH')}`);
        console.log(chalk.dim('  ' + '-'.repeat(70)));

        const rows = await Promise.all(worktrees.map(async (wt, index) => {
            const [typeKey, isClean, lastActive] = await Promise.all([
                detectWorktreeType(wt, mainWorktreePath),
                isGitClean(wt.path),
                getLastActivity(wt.path),
            ]);
            const type = formatWorktreeType(typeKey);
            const branchName = getWorktreeBranchName(wt);
            const stateLabel = (isClean ? 'clean' : 'dirty').padEnd(8);
            const stateText = isClean ? chalk.green(stateLabel) : chalk.yellow(stateLabel);
            const activeLabel = lastActive ? timeAgo(lastActive) : '—';
            const activeText = chalk.magenta(activeLabel.padEnd(14));

            return {
                text: `  ${type}  ${stateText} ${activeText} ${chalk.yellow(branchName)}`,
                sortType: WORKTREE_TYPE_ORDER[typeKey],
                sortBranch: branchName.toLowerCase(),
                sortIndex: index,
            };
        }));

        rows
            .sort((a, b) =>
                a.sortType - b.sortType ||
                a.sortBranch.localeCompare(b.sortBranch) ||
                a.sortIndex - b.sortIndex
            )
            .forEach(row => console.log(row.text));
        console.log('');
    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt list');
        process.exit(1);
    }
}
