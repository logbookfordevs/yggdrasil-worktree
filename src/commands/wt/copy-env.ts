import path from 'path';
import { findLocalEnvFiles, promptAndCopyEnvFiles } from '../../lib/env-files.js';
import { getRepoRoot, listWorktrees } from '../../lib/git.js';
import { log } from '../../lib/ui.js';

export async function copyEnvCommand() {
    try {
        const currentWorktreePath = await getRepoRoot();
        const worktrees = await listWorktrees();
        const mainWorktreePath = worktrees[0]?.path;

        if (!mainWorktreePath) {
            log.info('No main worktree found.');
            return;
        }

        if (path.resolve(currentWorktreePath) === path.resolve(mainWorktreePath)) {
            log.info('Already in the main worktree. Nothing to copy.');
            return;
        }

        const envFiles = await findLocalEnvFiles(mainWorktreePath);
        if (envFiles.length === 0) {
            log.info('No local env files found in the main worktree.');
            return;
        }

        await promptAndCopyEnvFiles(mainWorktreePath, currentWorktreePath, envFiles, {
            promptMessage: `Copy local env file${envFiles.length === 1 ? '' : 's'} from the main worktree to this worktree? (${envFiles.join(', ')})`,
        });
    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt copy-env');
        process.exit(1);
    }
}
