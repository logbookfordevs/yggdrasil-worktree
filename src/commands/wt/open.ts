import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { constants as fsConstants } from 'fs';
import { execa } from 'execa';
import { GitWorktree, listWorktrees, getRepoRoot } from '../../lib/git.js';
import { log, ui } from '../../lib/ui.js';
import { ensureAutocompletePrompt } from '../../lib/prompt.js';
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

interface OpenWorktreeCandidate {
    worktree: GitWorktree;
    label: string;
    searchText: string;
}

export interface OpenToolOption {
    id: string;
    name: string;
    command: string;
    kind: 'ide' | 'agent';
    aliases?: string[];
    args?: string[];
}

const CUSTOM_OPEN_TOOL_VALUE = '__custom_open_tool__';

const OPEN_TOOL_CANDIDATES: OpenToolOption[] = [
    { id: 'cursor', name: 'Cursor', command: 'cursor', kind: 'ide', aliases: ['cursor'] },
    { id: 'code', name: 'VS Code', command: 'code', kind: 'ide', aliases: ['vscode', 'code'] },
    { id: 'windsurf', name: 'Windsurf', command: 'windsurf', kind: 'ide', aliases: ['windsurf'] },
    { id: 'zed', name: 'Zed', command: 'zed', kind: 'ide', aliases: ['zed'] },
    { id: 'idea', name: 'IntelliJ IDEA', command: 'idea', kind: 'ide', aliases: ['idea', 'intellij'] },
    { id: 'webstorm', name: 'WebStorm', command: 'webstorm', kind: 'ide', aliases: ['webstorm'] },
    { id: 'subl', name: 'Sublime Text', command: 'subl', kind: 'ide', aliases: ['subl', 'sublime'] },
    { id: 'agy', name: 'Agy (Antigravity CLI)', command: 'agy', kind: 'agent', aliases: ['agy', 'antigravity'] },
    { id: 'claude', name: 'Claude Code', command: 'claude', kind: 'agent', aliases: ['claude', 'claude-code'] },
    { id: 'codex', name: 'Codex', command: 'codex', kind: 'agent', aliases: ['codex'] },
    { id: 'opencode', name: 'OpenCode', command: 'opencode', kind: 'agent', aliases: ['opencode'] },
];

const CUSTOM_AGENT_COMMANDS = new Set([
    ...OPEN_TOOL_CANDIDATES
        .filter(tool => tool.kind === 'agent')
        .map(tool => tool.command),
    'cursor-agent',
    'droid',
    'gemini',
    'pi',
]);

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
    const args = tool.args ?? [];
    if (args.length === 0) {
        return tool.command;
    }

    return [tool.command, ...args.map(quoteShellArg)].join(' ');
}

function splitCommandLine(input: string): string[] {
    const parts: string[] = [];
    let current = '';
    let quote: '"' | "'" | undefined;

    for (let index = 0; index < input.length; index += 1) {
        const character = input[index];

        if (character === '\\' && index + 1 < input.length) {
            index += 1;
            current += input[index];
            continue;
        }

        if ((character === '"' || character === "'") && quote === undefined) {
            quote = character;
            continue;
        }

        if (character === quote) {
            quote = undefined;
            continue;
        }

        if (/\s/.test(character) && quote === undefined) {
            if (current.length > 0) {
                parts.push(current);
                current = '';
            }
            continue;
        }

        current += character;
    }

    if (quote !== undefined) {
        return [];
    }

    if (current.length > 0) {
        parts.push(current);
    }

    return parts;
}

export function parseCustomOpenCommand(input: string): OpenToolOption | undefined {
    const parts = splitCommandLine(input.trim());
    const [command, ...args] = parts;

    if (!command) {
        return undefined;
    }

    const normalizedCommand = path.basename(command).toLowerCase();

    return {
        id: 'custom',
        name: input.trim(),
        command,
        kind: CUSTOM_AGENT_COMMANDS.has(normalizedCommand) ? 'agent' : 'ide',
        args,
    };
}

function quoteShellArg(arg: string): string {
    if (/^[A-Za-z0-9_/:=.,@%+-]+$/.test(arg)) {
        return arg;
    }

    return `'${arg.replace(/'/g, `'\\''`)}'`;
}

export function buildIdeOpenArgs(tool: OpenToolOption, wtPath: string): string[] {
    const args = tool.args ?? [];

    if (args.length === 0) {
        return [wtPath];
    }

    let hasWorktreePlaceholder = false;
    const resolvedArgs = args.map(arg => {
        if (arg === '.') {
            hasWorktreePlaceholder = true;
            return wtPath;
        }

        return arg;
    });

    return hasWorktreePlaceholder
        ? resolvedArgs
        : [...resolvedArgs, wtPath];
}

async function promptCustomOpenTool(): Promise<OpenToolOption> {
    const { commandLine } = await inquirer.prompt<{ commandLine: string }>([
        {
            type: 'input',
            name: 'commandLine',
            message: 'Command to run:',
            suffix: chalk.dim(' (examples: zed ., droid ., open -a Cursor .)'),
            validate: async (input: string) => {
                const customTool = parseCustomOpenCommand(input);
                if (!customTool) {
                    return 'Enter a command to run.';
                }

                return await commandExists(customTool.command)
                    ? true
                    : `Command "${customTool.command}" was not found in PATH.`;
            },
        },
    ]);

    return parseCustomOpenCommand(commandLine) as OpenToolOption;
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
    if (choices.length > 0) choices.push(new inquirer.Separator(" "));
    choices.push({
        name: `Other command... ${chalk.dim('(type a custom opener)')}`,
        value: CUSTOM_OPEN_TOOL_VALUE,
    });

    const { selectedTool } = await inquirer.prompt<{ selectedTool: OpenToolOption | typeof CUSTOM_OPEN_TOOL_VALUE }>([
        {
            type: 'list',
            name: 'selectedTool',
            message,
            choices,
            loop: false,
            pageSize: 10,
        },
    ]);

    return selectedTool === CUSTOM_OPEN_TOOL_VALUE
        ? promptCustomOpenTool()
        : selectedTool;
}

export async function launchOpenTool(tool: OpenToolOption, wtPath: string): Promise<void> {
    if (isAgentTool(tool)) {
        await enterCommand(wtPath, { exec: buildAgentExecCommand(tool) });
        return;
    }

    await execa(tool.command, buildIdeOpenArgs(tool, wtPath), {
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
            ensureAutocompletePrompt();
            const terminalColumns = process.stdout.columns || 100;
            const candidates: OpenWorktreeCandidate[] = await Promise.all(worktrees.map(async (wt) => {
                const type = await detectWorktreeType(wt, mainWorktreePath);
                const branchName = getWorktreeBranchName(wt);
                const displayPath = formatWorktreeDisplayPath(wt.path);
                const rawType = type.toLowerCase();
                const rawDisplayPath = displayPath.toLowerCase();
                const rawBranchName = branchName.toLowerCase();

                return {
                    worktree: wt,
                    label: formatWorktreeChoiceLabel(type, branchName, displayPath, terminalColumns),
                    searchText: `${rawType} ${rawBranchName} ${rawDisplayPath}`,
                };
            }));

            const { selectedWt } = await inquirer.prompt<{ selectedWt: GitWorktree }>([
                {
                    type: 'autocomplete',
                    name: 'selectedWt',
                    message: 'Select a worktree to open (type to filter):',
                    source: async (_answers: unknown, input = '') => {
                        const term = input.trim().toLowerCase();
                        const filtered = term
                            ? candidates.filter(candidate => candidate.searchText.includes(term))
                            : candidates;

                        return filtered.map(candidate => ({
                            name: candidate.label,
                            value: candidate.worktree,
                        }));
                    },
                    pageSize: 10,
                } as any,
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
            const customTool = parseCustomOpenCommand(requestedTool);
            if (!chosenTool && customTool && await commandExists(customTool.command)) {
                chosenTool = customTool;
            }

            if (!chosenTool) {
                const available = installedTools.map(tool => tool.command).join(', ') || 'none detected';
                log.error(`Tool "${requestedTool}" not found.`);
                log.dim(`Detected tool commands: ${available}`);
                return;
            }
        } else {
            chosenTool = await promptOpenToolSelection(installedTools);
        }

        log.info(`Opening ${ui.path(targetWt.path)} in ${chalk.cyan(chosenTool.name)}...`);
        await launchOpenTool(chosenTool, targetWt.path);
        log.success(isAgentTool(chosenTool) ? 'Agent launched.' : 'IDE launched.');
    } catch (error: any) {
        log.error(error.message);
    }
}
