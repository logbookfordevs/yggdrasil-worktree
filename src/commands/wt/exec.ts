import inquirer from 'inquirer';
import { spawn } from 'child_process';
import { execa } from 'execa';
import path from 'path';
import { listWorktrees, getRepoRoot } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log } from '../../lib/ui.js';

export async function execCommand(wtName?: string, commandArgs?: string[]) {
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
                    message: 'Select a worktree:',
                    choices,
                    loop: false
                }
            ]);

            targetWt = selectedWt;
        }

        let command: string;
        let args: string[] = [];

        if (commandArgs && commandArgs.length > 0) {
            command = commandArgs[0];
            args = commandArgs.slice(1);
        } else {
            const { inputCommand } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'inputCommand',
                    message: `Enter command to run in ${targetWt?.path}:`,
                    validate: (input) => input.trim().length > 0 || 'Command cannot be empty'
                }
            ]);
            
            // Basic shell-like parsing for the interactive input
            const parts = inputCommand.trim().split(/\s+/);
            command = parts[0];
            args = parts.slice(1);
        }

        log.info(`Executing: ${command} ${args.join(' ')} in ${targetWt?.path}`);

        await execa(command, args, {
            cwd: targetWt?.path,
            stdio: 'inherit',
            shell: false
        });

    } catch (error: any) {
        if (error.exitCode !== undefined) {
             // Command failed, but it already printed its error to inherited stdio
             return;
        }
        log.error(error.message);
    }
}
