import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { constants as fsConstants } from 'fs';
import { execa } from 'execa';
import { listWorktrees, getRepoRoot } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui } from '../../lib/ui.js';

interface OpenOptions {
    ide?: string;
}

interface IdeOption {
    id: string;
    name: string;
    command: string;
    aliases?: string[];
}

const IDE_CANDIDATES: IdeOption[] = [
    { id: 'cursor', name: 'Cursor', command: 'cursor', aliases: ['cursor'] },
    { id: 'code', name: 'VS Code', command: 'code', aliases: ['vscode', 'code'] },
    { id: 'windsurf', name: 'Windsurf', command: 'windsurf', aliases: ['windsurf'] },
    { id: 'zed', name: 'Zed', command: 'zed', aliases: ['zed'] },
    { id: 'agy', name: 'Agy', command: 'agy', aliases: ['agy'] },
    { id: 'idea', name: 'IntelliJ IDEA', command: 'idea', aliases: ['idea', 'intellij'] },
    { id: 'webstorm', name: 'WebStorm', command: 'webstorm', aliases: ['webstorm'] },
    { id: 'subl', name: 'Sublime Text', command: 'subl', aliases: ['subl', 'sublime'] },
];

type Worktree = { path: string; branch?: string; HEAD: string };

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

function formatWorktreeChoiceLabel(branchName: string, displayPath: string, terminalColumns: number): string {
    const maxRowWidth = Math.max(40, terminalColumns - 10);
    const branchWidth = Math.min(48, Math.max(16, Math.floor(maxRowWidth * 0.55)));
    const pathWidth = Math.max(12, maxRowWidth - branchWidth - 1);

    const branchText = truncateEnd(branchName, branchWidth).padEnd(branchWidth);
    const pathText = truncateStart(displayPath, pathWidth);
    return `${chalk.yellow(branchText)} ${chalk.cyan(pathText)}`;
}

async function commandExists(command: string): Promise<boolean> {
    if (!command) return false;

    const isWindows = process.platform === 'win32';
    const pathEntries = (process.env.PATH || '')
        .split(path.delimiter)
        .filter(Boolean);

    const extensions = isWindows
        ? (process.env.PATHEXT || '.EXE;.CMD;.BAT')
            .split(';')
            .map(ext => ext.toLowerCase())
        : [''];

    const hasPathSeparator = command.includes('/') || command.includes('\\');
    const candidates = hasPathSeparator
        ? [command]
        : pathEntries.flatMap(dir => extensions.map(ext => path.join(dir, `${command}${ext}`)));

    const mode = isWindows ? fsConstants.F_OK : fsConstants.X_OK;

    for (const candidate of candidates) {
        try {
            await fs.access(candidate, mode);
            return true;
        } catch {
            // Continue scanning
        }
    }

    return false;
}

async function detectInstalledIdes(): Promise<IdeOption[]> {
    const checks = await Promise.all(
        IDE_CANDIDATES.map(async ide => ({
            ide,
            exists: await commandExists(ide.command),
        }))
    );

    return checks
        .filter(check => check.exists)
        .map(check => check.ide);
}

function resolveWorktreeByName(worktrees: Worktree[], wtName: string): Worktree | undefined {
    return worktrees.find(wt => {
        const branchName = wt.branch || wt.HEAD || '';
        const relativePath = path.relative(WORKTREES_ROOT, wt.path);
        const basename = path.basename(wt.path);
        return branchName === wtName ||
            relativePath === wtName ||
            wt.path === wtName ||
            basename === wtName;
    });
}

function resolveIdeOption(input: string, installed: IdeOption[]): IdeOption | undefined {
    const normalized = input.trim().toLowerCase();
    return installed.find(ide =>
        ide.id === normalized ||
        ide.command.toLowerCase() === normalized ||
        ide.aliases?.some(alias => alias.toLowerCase() === normalized)
    );
}

export async function openCommand(wtName?: string, options: OpenOptions = {}) {
    try {
        await getRepoRoot();
        const worktrees = await listWorktrees();

        if (worktrees.length === 0) {
            log.info('No worktrees found.');
            return;
        }

        let targetWt: Worktree | undefined;
        if (wtName) {
            targetWt = resolveWorktreeByName(worktrees, wtName);
            if (!targetWt) {
                log.error(`Worktree "${wtName}" not found.`);
                return;
            }
        } else {
            const terminalColumns = process.stdout.columns || 100;
            const choices = worktrees.map(wt => {
                const branchName = wt.branch || wt.HEAD || 'detached';
                const isManaged = wt.path.startsWith(WORKTREES_ROOT);
                const displayPath = isManaged
                    ? path.relative(WORKTREES_ROOT, wt.path)
                    : wt.path.replace(process.env.HOME || '', '~');

                return {
                    name: formatWorktreeChoiceLabel(branchName, displayPath, terminalColumns),
                    value: wt,
                };
            });

            const { selectedWt } = await inquirer.prompt<{ selectedWt: Worktree }>([
                {
                    type: 'list',
                    name: 'selectedWt',
                    message: 'Select a worktree to open:',
                    choices,
                    loop: false,
                    pageSize: 10,
                },
            ]);

            targetWt = selectedWt;
        }

        if (!targetWt) {
            log.error('No worktree selected.');
            return;
        }

        const installedIdes = await detectInstalledIdes();

        let chosenIde: IdeOption | undefined;
        if (options.ide) {
            chosenIde = resolveIdeOption(options.ide, installedIdes);
            if (!chosenIde && await commandExists(options.ide)) {
                chosenIde = {
                    id: 'custom',
                    name: options.ide,
                    command: options.ide,
                };
            }

            if (!chosenIde) {
                const available = installedIdes.map(ide => ide.command).join(', ') || 'none detected';
                log.error(`IDE "${options.ide}" not found.`);
                log.dim(`Detected IDE commands: ${available}`);
                return;
            }
        } else {
            if (installedIdes.length === 0) {
                log.error('No supported IDE command was detected in PATH.');
                log.dim('Try: yggtree wt open --ide <command> (e.g. --ide cursor, --ide code)');
                return;
            }

            const { selectedIde } = await inquirer.prompt<{ selectedIde: IdeOption }>([
                {
                    type: 'list',
                    name: 'selectedIde',
                    message: 'Select IDE to open:',
                    choices: installedIdes.map(ide => ({
                        name: `${ide.name} ${chalk.dim(`(${ide.command})`)}`,
                        value: ide,
                    })),
                    loop: false,
                    pageSize: 10,
                },
            ]);

            chosenIde = selectedIde;
        }

        log.info(`Opening ${ui.path(targetWt.path)} in ${chalk.cyan(chosenIde.name)}...`);
        await execa(chosenIde.command, [targetWt.path], {
            cwd: targetWt.path,
            stdio: 'ignore',
        });
        log.success('IDE launched.');
    } catch (error: any) {
        log.error(error.message);
    }
}
