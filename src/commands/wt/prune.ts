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
            log.error(e.message);
        }
    } catch (error: any) {
        log.error(error.message);
        process.exit(1);
    }
}
