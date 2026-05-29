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
    enter?: boolean;
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
    kind: 'editor' | 'app';
    aliases?: string[];
    bundleId?: string;
}

export interface OpenAction {
    type: 'tool' | 'other-command';
    tool?: OpenToolOption;
    command?: string;
}

export const OPEN_TOOL_CANDIDATES: OpenToolOption[] = [
    { id: 'cursor', name: 'Cursor', command: 'cursor', kind: 'editor', aliases: ['cursor'] },
    { id: 'code', name: 'VS Code', command: 'code', kind: 'editor', aliases: ['vscode', 'code'] },
    { id: 'windsurf', name: 'Windsurf', command: 'windsurf', kind: 'editor', aliases: ['windsurf'] },
    { id: 'zed', name: 'Zed', command: 'zed', kind: 'editor', aliases: ['zed'] },
    { id: 'idea', name: 'IntelliJ IDEA', command: 'idea', kind: 'editor', aliases: ['idea', 'intellij'] },
    { id: 'webstorm', name: 'WebStorm', command: 'webstorm', kind: 'editor', aliases: ['webstorm'] },
    { id: 'subl', name: 'Sublime Text', command: 'subl', kind: 'editor', aliases: ['subl', 'sublime'] },
    {
        id: 'codex-app',
        name: 'Codex App',
        command: 'codex-app',
        kind: 'app',
        aliases: ['codex', 'codex-app'],
        bundleId: 'com.openai.codex',
    },
];

const OTHER_COMMAND_ACTION = '__other_command__';
const NO_OPEN_ACTION = '__no_open__';

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

export async function macOSAppBundleExists(bundleId: string): Promise<boolean> {
    if (process.platform !== 'darwin') return false;

    try {
        const result = await execa('/usr/bin/mdfind', [`kMDItemCFBundleIdentifier == '${bundleId}'`]);
        if (result.stdout.trim().length > 0) return true;
    } catch {
        // Fall back to common application roots when Spotlight is unavailable.
    }

    const commonAppPaths = [
        '/Applications/Codex.app',
        path.join(process.env.HOME || '', 'Applications', 'Codex.app'),
    ];

    return commonAppPaths.some(appPath => fs.existsSync(appPath));
}

export async function detectInstalledOpenTools(): Promise<OpenToolOption[]> {
    const checks = await Promise.all(
        OPEN_TOOL_CANDIDATES.map(async tool => ({
            tool,
            exists: tool.bundleId
                ? await macOSAppBundleExists(tool.bundleId)
                : await commandExists(tool.command),
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

export async function resolveOpenToolAction(input: string, installed: OpenToolOption[]): Promise<OpenAction | undefined> {
    let chosenTool = resolveOpenToolOption(input, installed);
    if (!chosenTool && await commandExists(input)) {
        chosenTool = {
            id: 'custom',
            name: input,
            command: input,
            kind: 'editor',
        };
    }

    return chosenTool ? { type: 'tool', tool: chosenTool } : undefined;
}

export async function promptOpenToolSelection(
    installedTools: OpenToolOption[],
    message = 'Select tool to open:'
): Promise<OpenToolOption> {
    const ideChoices = installedTools
        .filter(tool => tool.kind === 'editor')
        .map(tool => ({
            name: `${tool.name} ${chalk.dim(`(${tool.command})`)}`,
            value: tool,
        }));

    const appChoices = installedTools
        .filter(tool => tool.kind === 'app')
        .map(tool => ({
            name: `${tool.name} ${chalk.dim(`(${tool.command})`)}`,
            value: tool,
        }));

    const choices: any[] = [];
    if (ideChoices.length > 0) {
        choices.push(new inquirer.Separator(chalk.dim('── Editors ──')));
        choices.push(...ideChoices);
    }
    if (appChoices.length > 0) {
        choices.push(new inquirer.Separator(chalk.dim('── Apps ──')));
        choices.push(...appChoices);
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

export function buildOpenActionsFromSelection(
    selectedValues: string[],
    installedTools: OpenToolOption[],
    otherCommand?: string,
): OpenAction[] {
    if (selectedValues.includes(NO_OPEN_ACTION)) return [];

    const actions: OpenAction[] = selectedValues
        .filter(value => value.startsWith('tool:'))
        .map(value => installedTools.find(tool => `tool:${tool.id}` === value))
        .filter((tool): tool is OpenToolOption => Boolean(tool))
        .map(tool => ({ type: 'tool', tool }));

    if (selectedValues.includes(OTHER_COMMAND_ACTION) && otherCommand?.trim()) {
        actions.push({ type: 'other-command', command: otherCommand.trim() });
    }

    return actions;
}

export function validateOpenActionSelection(selectedValues: string[]): true | string {
    if (selectedValues.includes(NO_OPEN_ACTION) && selectedValues.length > 1) {
        return 'Choose either "Nothing" or one or more actions, not both.';
    }
    return true;
}

export async function promptOpenActions(
    installedTools: OpenToolOption[],
    options: { message?: string; allowShellAction?: boolean } = {},
): Promise<OpenAction[]> {
    const allowShellAction = options.allowShellAction ?? true;
    const choices: any[] = [];

    if (installedTools.length > 0) {
        const editorTools = installedTools.filter(tool => tool.kind === 'editor');
        const appTools = installedTools.filter(tool => tool.kind === 'app');

        if (editorTools.length > 0) {
            choices.push(new inquirer.Separator(chalk.dim('── Editors ──')));
            choices.push(...editorTools.map(tool => ({
                name: `${tool.name} ${chalk.dim(`(${tool.command})`)}`,
                value: `tool:${tool.id}`,
            })));
        }

        if (appTools.length > 0) {
            choices.push(new inquirer.Separator(chalk.dim('── Apps ──')));
            choices.push(...appTools.map(tool => ({
                name: `${tool.name} ${chalk.dim(`(${tool.command})`)}`,
                value: `tool:${tool.id}`,
            })));
        }
    }

    if (allowShellAction) {
        if (choices.length > 0) choices.push(new inquirer.Separator(' '));
        choices.push(new inquirer.Separator(chalk.dim('── Shell ──')));
        choices.push({
            name: `Other command... ${chalk.dim('(run first, then stay in shell)')}`,
            value: OTHER_COMMAND_ACTION,
        });
    }

    if (choices.length > 0) choices.push(new inquirer.Separator(' '));
    choices.push({
        name: allowShellAction ? 'Nothing, just enter the shell' : 'Do not open anything',
        value: NO_OPEN_ACTION,
    });

    const { selectedValues } = await inquirer.prompt<{ selectedValues: string[] }>([
        {
            type: 'checkbox',
            name: 'selectedValues',
            message: options.message || 'Open anything before entering the shell?',
            choices,
            loop: false,
            pageSize: 10,
            validate: validateOpenActionSelection,
        },
    ]);

    let otherCommand: string | undefined;
    if (selectedValues.includes(OTHER_COMMAND_ACTION)) {
        const answer = await inquirer.prompt<{ otherCommand: string }>([
            {
                type: 'input',
                name: 'otherCommand',
                message: 'Command to run in the worktree shell:',
                validate: (input: string) => input.trim().length > 0 || 'Command is required',
            },
        ]);
        otherCommand = answer.otherCommand;
    }

    return buildOpenActionsFromSelection(selectedValues, installedTools, otherCommand);
}

export async function launchOpenTool(tool: OpenToolOption, wtPath: string): Promise<void> {
    const { executable, args } = buildOpenToolLaunchCommand(tool, wtPath);

    await execa(executable, args, {
        cwd: wtPath,
        stdio: 'ignore',
    });
}

export function buildOpenToolLaunchCommand(tool: OpenToolOption, wtPath: string): { executable: string; args: string[] } {
    if (tool.bundleId) {
        return {
            executable: '/usr/bin/open',
            args: ['-b', tool.bundleId, wtPath],
        };
    }

    return {
        executable: tool.command,
        args: [wtPath],
    };
}

export async function runOpenActions(actions: OpenAction[], wtPath: string, options: { enter?: boolean } = {}): Promise<void> {
    for (const action of actions) {
        if (action.type === 'tool' && action.tool) {
            log.info(`Opening ${ui.path(wtPath)} in ${chalk.cyan(action.tool.name)}...`);
            await launchOpenTool(action.tool, wtPath);
        }
    }

    const shellAction = actions.find(action => action.type === 'other-command');
    if (shellAction?.command) {
        await enterCommand(wtPath, { exec: shellAction.command });
        return;
    }

    if (options.enter !== false) {
        await enterCommand(wtPath);
    }
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

        const requestedTool = options.tool;
        const shouldEnter = options.enter === true;

        if (requestedTool) {
            const toolAction = await resolveOpenToolAction(requestedTool, installedTools);

            if (!toolAction) {
                const available = installedTools.map(tool => tool.command).join(', ') || 'none detected';
                log.error(`Tool "${requestedTool}" not found.`);
                log.dim(`Detected tool commands: ${available}`);
                return;
            }

            await runOpenActions([toolAction], targetWt.path, { enter: shouldEnter });
            log.success('Worktree opened.');
            return;
        } else {
            if (installedTools.length === 0 && !shouldEnter) {
                log.error('No supported editor command or app was detected.');
                log.dim('Try: yggtree open --tool <command> (e.g. --tool cursor or --tool codex-app), or yggtree open --enter');
                return;
            }

            const actions = await promptOpenActions(installedTools, {
                allowShellAction: shouldEnter,
                message: shouldEnter ? 'Open anything before entering the shell?' : 'Open anything?',
            });
            await runOpenActions(actions, targetWt.path, { enter: shouldEnter });
        }
        log.success('Worktree opened.');
    } catch (error: any) {
        log.error(error.message);
    }
}
