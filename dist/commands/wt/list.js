import chalk from 'chalk';
import { listWorktrees, getRepoRoot } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log } from '../../lib/ui.js';
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
        console.log(`  ${chalk.dim('TYPE')}    ${chalk.dim('BRANCH')}             ${chalk.dim('PATH')}`);
        console.log(chalk.dim('  ' + '-'.repeat(60)));
        for (const wt of worktrees) {
            const isManaged = wt.path.startsWith(WORKTREES_ROOT);
            const isMain = !isManaged; // Simplification: assume main repo is not in managed dir
            const type = isManaged ? chalk.green('MANAGED') : chalk.blue('MAIN   ');
            const branchName = wt.branch || wt.HEAD || 'detached';
            const displayPath = wt.path.replace(process.env.HOME || '', '~');
            const colorPath = isManaged ? chalk.cyan(displayPath) : chalk.dim(displayPath);
            console.log(`  ${type}  ${chalk.yellow(branchName.padEnd(18))} ${colorPath}`);
        }
        console.log('');
    }
    catch (error) {
        log.error(error.message);
        process.exit(1);
    }
}
