import inquirer from 'inquirer';
import path from 'path';
import { listWorktrees, getRepoRoot } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log } from '../../lib/ui.js';

export async function pathCommand(wtName?: string) {
    try {
        await getRepoRoot();
        const worktrees = await listWorktrees();

        if (worktrees.length === 0) {
            log.info('No worktrees found.');
            return;
        }

        let targetWt: { path: string; branch?: string; HEAD: string } | undefined;

        if (wtName) {
            // Find worktree by name (branch name, relative path, or slug/basename)
            targetWt = worktrees.find(wt => {
                const branchName = wt.branch || wt.HEAD || '';
                const relativePath = path.relative(WORKTREES_ROOT, wt.path);
                const basename = path.basename(wt.path);
                return branchName === wtName || 
                       relativePath === wtName || 
                       wt.path === wtName || 
                       basename === wtName;
            });

            if (!targetWt) {
                log.error(`Worktree "${wtName}" not found.`);
                return;
            }
        } else {
            // Interactive Selection
            const choices = worktrees.map(wt => {
                const branchName = wt.branch || wt.HEAD || 'detached';
                const isManaged = wt.path.startsWith(WORKTREES_ROOT);
                const displayPath = isManaged 
                    ? path.relative(WORKTREES_ROOT, wt.path)
                    : wt.path.replace(process.env.HOME || '', '~');
                
                return {
                    name: `${branchName.padEnd(20)} ${displayPath}`,
                    value: wt
                };
            });

            const { selectedWt } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedWt',
                    message: 'Select a worktree to get path:',
                    choices,
                    loop: false
                }
            ]);

            targetWt = selectedWt;
        }

        if (targetWt) {
            console.log(`cd "${targetWt.path}"`);
        }

    } catch (error: any) {
        log.error(error.message);
    }
}
