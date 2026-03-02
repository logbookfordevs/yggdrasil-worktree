import inquirer from 'inquirer';
import { GitWorktree, listWorktrees, getRepoRoot } from '../../lib/git.js';
import { log } from '../../lib/ui.js';
import { findWorktreeByName, formatWorktreeDisplayPath, getWorktreeBranchName } from '../../lib/worktree.js';

export async function pathCommand(wtName?: string) {
    try {
        await getRepoRoot();
        const worktrees = await listWorktrees();

        if (worktrees.length === 0) {
            log.info('No worktrees found.');
            return;
        }

        let targetWt: GitWorktree | undefined;

        if (wtName) {
            targetWt = findWorktreeByName(worktrees, wtName);

            if (!targetWt) {
                log.error(`Worktree "${wtName}" not found.`);
                return;
            }
        } else {
            // Interactive Selection
            const choices = worktrees.map(wt => {
                const branchName = getWorktreeBranchName(wt);
                const displayPath = formatWorktreeDisplayPath(wt.path);
                
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
