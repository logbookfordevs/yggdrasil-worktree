import inquirer from 'inquirer';
import { spawn } from 'child_process';
import { execa } from 'execa';
import chalk from 'chalk';
import { GitWorktree, listWorktrees, getRepoRoot } from '../../lib/git.js';
import { log, ui } from '../../lib/ui.js';
import {
    detectWorktreeType,
    findWorktreeByName,
    formatWorktreeDisplayPath,
    formatWorktreeType,
    getWorktreeBranchName,
    WorktreeType,
} from '../../lib/worktree.js';

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

function formatChoiceLabel(type: WorktreeType, branchName: string, displayPath: string, terminalColumns: number): string {
    const maxRowWidth = Math.max(40, terminalColumns - 10);
    const typeWidth = 8;
    const availableWidth = Math.max(22, maxRowWidth - typeWidth);
    const branchWidth = Math.min(44, Math.max(12, Math.floor(availableWidth * 0.55)));
    const pathWidth = Math.max(10, availableWidth - branchWidth - 1);

    const branchText = truncateEnd(branchName, branchWidth).padEnd(branchWidth);
    const pathText = truncateStart(displayPath, pathWidth);
    const typeText = formatWorktreeType(type);

    return `${typeText} ${chalk.yellow(branchText)} ${chalk.cyan(pathText)}`;
}

export async function enterCommand(wtName?: string, options: { exec?: string } = {}) {
    try {
        await getRepoRoot();
        const worktrees = await listWorktrees();
        const mainWorktreePath = worktrees[0]?.path || '';

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
            const terminalColumns = process.stdout.columns || 100;
            const choices = await Promise.all(worktrees.map(async (wt) => {
                const type = await detectWorktreeType(wt, mainWorktreePath);
                const branchName = getWorktreeBranchName(wt);
                const displayPath = formatWorktreeDisplayPath(wt.path);
                
                return {
                    name: formatChoiceLabel(type, branchName, displayPath, terminalColumns),
                    value: wt
                };
            }));

            const { selectedWt } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedWt',
                    message: 'Select a worktree to enter:',
                    choices,
                    loop: false,
                    pageSize: 10,
                }
            ]);

            targetWt = selectedWt;
        }
        const finalExec = options.exec;

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
