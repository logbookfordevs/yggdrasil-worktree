import inquirer from 'inquirer';
import { execa } from 'execa';
import { GitWorktree, listWorktrees, getRepoRoot } from '../../lib/git.js';
import { log } from '../../lib/ui.js';
import { findWorktreeByName, formatWorktreeDisplayPath, getWorktreeBranchName } from '../../lib/worktree.js';

export async function execCommand(wtName?: string, commandArgs?: string[]) {
    let targetWt: GitWorktree | undefined;
    let command = '';
    let args: string[] = [];

    try {
        await getRepoRoot();
        const worktrees = await listWorktrees();

        if (worktrees.length === 0) {
            log.info('No worktrees found.');
            return;
        }

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
                    message: 'Select a worktree:',
                    choices,
                    loop: false
                }
            ]);

            targetWt = selectedWt;
        }

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
        log.actionableError(error.message, `${command} ${args.join(' ')}`, targetWt?.path, [
            `cd ${targetWt?.path} && ${command} ${args.join(' ')}`,
            'Check if the command exists and is in your PATH'
        ]);
    }
}
