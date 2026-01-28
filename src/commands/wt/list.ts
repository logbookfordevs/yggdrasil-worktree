import chalk from 'chalk';
import path from 'path';
import { listWorktrees, getRepoRoot, isGitClean } from '../../lib/git.js';
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
        console.log(`  ${chalk.dim('TYPE')}    ${chalk.dim('STATE')}    ${chalk.dim('BRANCH')}             ${chalk.dim('PATH')}`);
        console.log(chalk.dim('  ' + '-'.repeat(75)));

        for (const wt of worktrees) {
            const isManaged = wt.path.startsWith(WORKTREES_ROOT);
            const type = isManaged ? chalk.green('MANAGED') : chalk.blue('MAIN   ');
            
            const branchName = wt.branch || wt.HEAD || 'detached';
            let displayPath = wt.path.replace(process.env.HOME || '', '~');
            
            if (isManaged) {
                displayPath = path.relative(WORKTREES_ROOT, wt.path);
            }
            
            const colorPath = isManaged ? chalk.cyan(displayPath) : chalk.dim(displayPath);

            const isClean = await isGitClean(wt.path);
            const stateLabel = (isClean ? 'clean' : 'dirty').padEnd(8);
            const stateText = isClean ? chalk.green(stateLabel) : chalk.yellow(stateLabel);

            console.log(`  ${type}  ${stateText} ${chalk.yellow(branchName.padEnd(18))} ${colorPath}`);
        }
        console.log('');
    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt list');
        process.exit(1);
    }
}
