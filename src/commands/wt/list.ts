import chalk from 'chalk';
import { listWorktrees, getRepoRoot, isGitClean, getLastActivity } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, timeAgo } from '../../lib/ui.js';

export async function listCommand() {
    try {
        const _ = await getRepoRoot(); // Verify we are in a git repo
        const worktrees = await listWorktrees();
        
        if (worktrees.length === 0) {
            log.info('No worktrees found.');
            return;
        }

        console.log(chalk.bold('\n  Active Worktrees:\n'));

        // Header
        console.log(`  ${chalk.dim('TYPE')}    ${chalk.dim('STATE')}    ${chalk.dim('LAST ACTIVE')}    ${chalk.dim('BRANCH')}`);
        console.log(chalk.dim('  ' + '-'.repeat(70)));

        for (const wt of worktrees) {
            const isManaged = wt.path.startsWith(WORKTREES_ROOT);
            const type = isManaged ? chalk.green('MANAGED') : chalk.blue('MAIN   ');
            
            const branchName = wt.branch || wt.HEAD || 'detached';

            // Fetch state and activity in parallel
            const [isClean, lastActive] = await Promise.all([
                isGitClean(wt.path),
                getLastActivity(wt.path),
            ]);

            const stateLabel = (isClean ? 'clean' : 'dirty').padEnd(8);
            const stateText = isClean ? chalk.green(stateLabel) : chalk.yellow(stateLabel);

            const activeLabel = lastActive ? timeAgo(lastActive) : '—';
            const activeText = chalk.magenta(activeLabel.padEnd(14));

            console.log(`  ${type}  ${stateText} ${activeText} ${chalk.yellow(branchName)}`);
        }
        console.log('');
    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt list');
        process.exit(1);
    }
}
