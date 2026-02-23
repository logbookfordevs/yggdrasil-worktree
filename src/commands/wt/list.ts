import chalk from 'chalk';
import fs from 'fs-extra';
import { listWorktrees, getRepoRoot, isGitClean, getLastActivity } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, timeAgo } from '../../lib/ui.js';
import { getSandboxMetaPath } from '../../lib/sandbox.js';

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

        const typeOrder = {
            MAIN: 0,
            MANAGED: 1,
            SANDBOX: 2,
            LINKED: 3,
        } as const;

        const rows = await Promise.all(worktrees.map(async (wt, index) => {
            const isManaged = wt.path.startsWith(WORKTREES_ROOT);

            // Sandbox is only a managed worktree with sandbox metadata or sandbox branch naming.
            const [hasSandboxMeta, isClean, lastActive] = await Promise.all([
                fs.pathExists(getSandboxMetaPath(wt.path)),
                isGitClean(wt.path),
                getLastActivity(wt.path),
            ]);

            const isSandboxBranch = (wt.branch || '').startsWith('sandbox-');
            const isSandbox = isManaged && (hasSandboxMeta || isSandboxBranch);

            const typeKey: keyof typeof typeOrder = isSandbox
                ? 'SANDBOX'
                : isManaged
                    ? 'MANAGED'
                    : wt.path === mainWorktreePath
                        ? 'MAIN'
                        : 'LINKED';

            const type = typeKey === 'SANDBOX'
                ? chalk.magenta('SANDBOX')
                : typeKey === 'MANAGED'
                    ? chalk.green('MANAGED')
                    : typeKey === 'MAIN'
                        ? chalk.blue('MAIN   ')
                        : chalk.cyan('LINKED ');

            const branchName = wt.branch || wt.HEAD || 'detached';
            const stateLabel = (isClean ? 'clean' : 'dirty').padEnd(8);
            const stateText = isClean ? chalk.green(stateLabel) : chalk.yellow(stateLabel);
            const activeLabel = lastActive ? timeAgo(lastActive) : '—';
            const activeText = chalk.magenta(activeLabel.padEnd(14));

            return {
                text: `  ${type}  ${stateText} ${activeText} ${chalk.yellow(branchName)}`,
                sortType: typeOrder[typeKey],
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
