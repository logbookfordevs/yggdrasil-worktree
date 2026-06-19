import chalk from 'chalk';
import { listWorktrees, getRepoRoot, isGitClean, getLastActivity, isGhAvailable, getPrStatusBatch, PrStatus } from '../../lib/git.js';
import { getManagedWorktreesRoot } from '../../lib/global-config.js';
import { log, timeAgo, createSpinner } from '../../lib/ui.js';
import {
    detectWorktreeType,
    formatWorktreeType,
    formatPrStatus,
    getWorktreeBranchName,
    WORKTREE_TYPE_ORDER,
} from '../../lib/worktree.js';

export async function listCommand() {
    try {
        const repoRoot = await getRepoRoot(); // Verify we are in a git repo
        const worktrees = await listWorktrees();
        const mainWorktreePath = worktrees[0]?.path || '';
        const managedRoot = await getManagedWorktreesRoot(repoRoot);
        
        if (worktrees.length === 0) {
            log.info('No worktrees found.');
            return;
        }

        // Determine if PR status column should be shown
        const ghReady = await isGhAvailable();

        // Collect branch names for batch PR lookup
        const branches = worktrees.map(wt => getWorktreeBranchName(wt));
        const prStatusMap = ghReady ? await getPrStatusBatch(branches) : new Map<string, PrStatus>();
        const showPr = prStatusMap.size > 0;

        console.log(chalk.bold('\n  Active Worktrees:\n'));

        // Header — PR column only appears when there's data
        const headerPr = showPr ? `${chalk.dim('PR')}            ` : '';
        console.log(`  ${chalk.dim('TYPE')}    ${chalk.dim('STATE')}    ${chalk.dim('LAST ACTIVE')}     ${headerPr}${chalk.dim('BRANCH')}`);
        console.log(chalk.dim('  ' + '-'.repeat(showPr ? 90 : 70)));

        const rows = await Promise.all(worktrees.map(async (wt, index) => {
            const [typeKey, isClean, lastActive] = await Promise.all([
                detectWorktreeType(wt, mainWorktreePath, managedRoot),
                isGitClean(wt.path),
                getLastActivity(wt.path),
            ]);
            const type = formatWorktreeType(typeKey);
            const branchName = getWorktreeBranchName(wt);
            const stateLabel = (isClean ? 'clean' : 'dirty').padEnd(8);
            const stateText = isClean ? chalk.green(stateLabel) : chalk.yellow(stateLabel);
            const activeLabel = lastActive ? timeAgo(lastActive) : '—';
            const activeText = chalk.magenta(activeLabel.padEnd(14));

            const prStatus = prStatusMap.get(branchName);
            const prText = showPr
                ? (prStatus ? formatPrStatus(prStatus).padEnd(24) : chalk.dim('—'.padEnd(14)))
                : '';

            return {
                text: `  ${type}  ${stateText} ${activeText} ${prText}${chalk.yellow(branchName)}`,
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

        if (ghReady && !showPr) {
            console.log(chalk.dim('\n  ℹ No open PRs found for any worktree branch.'));
        } else if (!ghReady) {
            console.log(chalk.dim('\n  ℹ PR status omitted (gh CLI not found). Install GitHub CLI for PR tracking.'));
        }
        console.log('');
    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt list');
        process.exit(1);
    }
}
