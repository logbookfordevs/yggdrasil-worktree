import { pruneWorktrees, getRepoRoot } from '../../lib/git.js';
import { log, createSpinner } from '../../lib/ui.js';

export async function pruneCommand() {
    try {
        const _ = await getRepoRoot();
        const spinner = createSpinner('Pruning stale worktrees...').start();
        
        try {
            await pruneWorktrees();
            spinner.succeed('Worktrees pruned.');
        } catch (e: any) {
            spinner.fail('Failed to prune worktrees.');
            log.actionableError(e.message, 'git worktree prune', undefined, [
                'Try running manually: git worktree prune',
                'Check if any worktree folders were deleted manually without using git'
            ]);
        }
    } catch (error: any) {
        log.error(error.message);
        process.exit(1);
    }
}
