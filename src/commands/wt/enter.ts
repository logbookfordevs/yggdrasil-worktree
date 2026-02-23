import inquirer from 'inquirer';
import { spawn } from 'child_process';
import { execa } from 'execa';
import chalk from 'chalk';
import path from 'path';
import { listWorktrees, getRepoRoot } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui } from '../../lib/ui.js';

function truncateEnd(value: string, maxLen: number): string {
    if (maxLen <= 0) return '';
    if (value.length <= maxLen) return value;
    if (maxLen <= 1) return '…';
    return `${value.slice(0, maxLen - 1)}…`;
}

function truncateStart(value: string, maxLen: number): string {
    if (maxLen <= 0) return '';
    if (value.length <= maxLen) return value;
    if (maxLen <= 1) return '…';
    return `…${value.slice(-(maxLen - 1))}`;
}

function formatChoiceLabel(branchName: string, displayPath: string, terminalColumns: number): string {
    const maxRowWidth = Math.max(40, terminalColumns - 10);
    const branchWidth = Math.min(48, Math.max(16, Math.floor(maxRowWidth * 0.55)));
    const pathWidth = Math.max(12, maxRowWidth - branchWidth - 1);

    const branchText = truncateEnd(branchName, branchWidth).padEnd(branchWidth);
    const pathText = truncateStart(displayPath, pathWidth);

    return `${chalk.yellow(branchText)} ${chalk.cyan(pathText)}`;
}

export async function enterCommand(wtName?: string, options: { exec?: string } = {}) {
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
            const terminalColumns = process.stdout.columns || 100;
            const choices = worktrees.map(wt => {
                const branchName = wt.branch || wt.HEAD || 'detached';
                const isManaged = wt.path.startsWith(WORKTREES_ROOT);
                const displayPath = isManaged 
                    ? path.relative(WORKTREES_ROOT, wt.path)
                    : wt.path.replace(process.env.HOME || '', '~');
                
                return {
                    name: formatChoiceLabel(branchName, displayPath, terminalColumns),
                    value: wt
                };
            });

            const { selectedWt } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedWt',
                    message: 'Select a worktree to enter:',
                    choices,
                    loop: false
                }
            ]);

            targetWt = selectedWt;
        }
        const { execCommandStr } = await inquirer.prompt([
            {
                type: 'input',
                name: 'execCommandStr',
                message: 'Command to run before entering (optional):',
                default: options.exec,
                when: options.exec === undefined,
            }
        ]);

        const finalExec = options.exec || execCommandStr;

        if (finalExec && finalExec.trim()) {
            log.info(`Executing: ${finalExec} in ${ui.path(targetWt?.path || '')}`);
            try {
                await execa(finalExec, {
                    cwd: targetWt?.path,
                    stdio: 'inherit',
                    shell: true
                });
            } catch (error: any) {
                log.error(`Command failed: ${error.message}`);
                // Ask if still want to enter?
                const { stillEnter } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'stillEnter',
                    message: 'Command failed. Do you still want to enter the sub-shell?',
                    default: true
                }]);
                if (!stillEnter) return;
            }
        }

        log.info(`Spawning sub-shell in ${ui.path(targetWt?.path || '')}...`);
        log.dim('Type "exit" to return to the main terminal.');

        const shell = process.env.SHELL || 'zsh';
        const child = spawn(shell, [], {
            cwd: targetWt?.path,
            stdio: 'inherit',
            env: {
                ...process.env,
                YGGTREE_SHELL: 'true'
            }
        });

        child.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                // Command failed with non-zero exit code
            }
            log.info('Exited sub-shell.');
        });

    } catch (error: any) {
        log.error(error.message);
    }
}
