import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { constants as fsConstants } from 'fs';
import { execa } from 'execa';
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
import { enterCommand } from './enter.js';

interface OpenOptions {
    tool?: string;
}

export interface OpenToolOption {
    id: string;
    name: string;
    command: string;
    kind: 'ide' | 'agent';
    aliases?: string[];
}

const OPEN_TOOL_CANDIDATES: OpenToolOption[] = [
    { id: 'cursor', name: 'Cursor', command: 'cursor', kind: 'ide', aliases: ['cursor'] },
    { id: 'code', name: 'VS Code', command: 'code', kind: 'ide', aliases: ['vscode', 'code'] },
    { id: 'windsurf', name: 'Windsurf', command: 'windsurf', kind: 'ide', aliases: ['windsurf'] },
    { id: 'zed', name: 'Zed', command: 'zed', kind: 'ide', aliases: ['zed'] },
    { id: 'agy', name: 'Agy', command: 'agy', kind: 'ide', aliases: ['agy'] },
    { id: 'idea', name: 'IntelliJ IDEA', command: 'idea', kind: 'ide', aliases: ['idea', 'intellij'] },
    { id: 'webstorm', name: 'WebStorm', command: 'webstorm', kind: 'ide', aliases: ['webstorm'] },
    { id: 'subl', name: 'Sublime Text', command: 'subl', kind: 'ide', aliases: ['subl', 'sublime'] },
    { id: 'claude', name: 'Claude Code', command: 'claude', kind: 'agent', aliases: ['claude', 'claude-code'] },
    { id: 'codex', name: 'Codex', command: 'codex', kind: 'agent', aliases: ['codex'] },
    { id: 'gemini', name: 'Gemini CLI', command: 'gemini', kind: 'agent', aliases: ['gemini'] },
    { id: 'opencode', name: 'OpenCode', command: 'opencode', kind: 'agent', aliases: ['opencode'] },
];

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

function formatWorktreeChoiceLabel(type: WorktreeType, branchName: string, displayPath: string, terminalColumns: number): string {
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

export async function commandExists(command: string): Promise<boolean> {
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

export async function detectInstalledOpenTools(): Promise<OpenToolOption[]> {
    const checks = await Promise.all(
        OPEN_TOOL_CANDIDATES.map(async tool => ({
            tool,
            exists: await commandExists(tool.command),
        }))
    );

    return checks
        .filter(check => check.exists)
        .map(check => check.tool);
}

function resolveWorktreeByName(worktrees: GitWorktree[], wtName: string): GitWorktree | undefined {
    return findWorktreeByName(worktrees, wtName);
}

export function resolveOpenToolOption(input: string, installed: OpenToolOption[]): OpenToolOption | undefined {
    const normalized = input.trim().toLowerCase();
    return installed.find(tool =>
        tool.id === normalized ||
        tool.command.toLowerCase() === normalized ||
        tool.aliases?.some(alias => alias.toLowerCase() === normalized)
    );
}

export function isAgentTool(tool: OpenToolOption): boolean {
    return tool.kind === 'agent';
}

export function buildAgentExecCommand(tool: OpenToolOption): string {
    return tool.command;
}

export async function promptOpenToolSelection(
    installedTools: OpenToolOption[],
    message = 'Select tool to open:'
): Promise<OpenToolOption> {
    const ideChoices = installedTools
        .filter(tool => tool.kind === 'ide')
        .map(tool => ({
            name: `${tool.name} ${chalk.dim(`(${tool.command})`)}`,
            value: tool,
        }));

    const agentChoices = installedTools
        .filter(tool => tool.kind === 'agent')
        .map(tool => ({
            name: `${tool.name} ${chalk.dim(`(${tool.command})`)}`,
            value: tool,
        }));

    const choices: any[] = [];
    if (ideChoices.length > 0) {
        choices.push(new inquirer.Separator(chalk.dim('── IDEs ──')));
        choices.push(...ideChoices);
    }
    if (agentChoices.length > 0) {
        if (choices.length > 0) choices.push(new inquirer.Separator(" "));
        choices.push(new inquirer.Separator(chalk.dim('── Agent CLIs ──')));
        choices.push(...agentChoices);
    }

    const { selectedTool } = await inquirer.prompt<{ selectedTool: OpenToolOption }>([
        {
            type: 'list',
            name: 'selectedTool',
            message,
            choices,
            loop: false,
            pageSize: 10,
        },
    ]);

    return selectedTool;
}

export async function launchOpenTool(tool: OpenToolOption, wtPath: string): Promise<void> {
    if (isAgentTool(tool)) {
        await enterCommand(wtPath, { exec: buildAgentExecCommand(tool) });
        return;
    }

    await execa(tool.command, [wtPath], {
        cwd: wtPath,
        stdio: 'ignore',
    });
}

export async function openCommand(wtName?: string, options: OpenOptions = {}) {
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
            targetWt = resolveWorktreeByName(worktrees, wtName);
            if (!targetWt) {
                log.error(`Worktree "${wtName}" not found.`);
                return;
            }
        } else {
            const terminalColumns = process.stdout.columns || 100;
            const choices = await Promise.all(worktrees.map(async (wt) => {
                const type = await detectWorktreeType(wt, mainWorktreePath);
                const branchName = getWorktreeBranchName(wt);
                const displayPath = formatWorktreeDisplayPath(wt.path);

                return {
                    name: formatWorktreeChoiceLabel(type, branchName, displayPath, terminalColumns),
                    value: wt,
                };
            }));

            const { selectedWt } = await inquirer.prompt<{ selectedWt: GitWorktree }>([
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

        const installedTools = await detectInstalledOpenTools();

        let chosenTool: OpenToolOption | undefined;
        const requestedTool = options.tool;

        if (requestedTool) {
            chosenTool = resolveOpenToolOption(requestedTool, installedTools);
            if (!chosenTool && await commandExists(requestedTool)) {
                chosenTool = {
                    id: 'custom',
                    name: requestedTool,
                    command: requestedTool,
                    kind: 'ide',
                };
            }

            if (!chosenTool) {
                const available = installedTools.map(tool => tool.command).join(', ') || 'none detected';
                log.error(`Tool "${requestedTool}" not found.`);
                log.dim(`Detected tool commands: ${available}`);
                return;
            }
        } else {
            if (installedTools.length === 0) {
                log.error('No supported open tool command was detected in PATH.');
                log.dim('Try: yggtree wt open --tool <command> (e.g. --tool cursor, --tool claude)');
                return;
            }

            chosenTool = await promptOpenToolSelection(installedTools);
        }

        log.info(`Opening ${ui.path(targetWt.path)} in ${chalk.cyan(chosenTool.name)}...`);
        await launchOpenTool(chosenTool, targetWt.path);
        log.success(isAgentTool(chosenTool) ? 'Agent launched.' : 'IDE launched.');
    } catch (error: any) {
        log.error(error.message);
    }
}
