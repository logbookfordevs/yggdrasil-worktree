import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { constants as fsConstants } from 'fs';
import { execa } from 'execa';
import { GitWorktree, listWorktrees, getRepoRoot } from '../../lib/git.js';
import { getManagedWorktreesRoot } from '../../lib/global-config.js';
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
    kind: 'editor' | 'app' | 'terminal';
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
    { id: 'cmux', name: 'Cmux Panel', command: 'cmux', kind: 'terminal', aliases: ['cmux', 'cmux-panel'] },
    { id: 'tmux', name: 'Tmux Session', command: 'tmux', kind: 'terminal', aliases: ['tmux', 'tmux-session'] },
];

const OTHER_COMMAND_ACTION = '__other_command__';
const NO_OPEN_ACTION = '__no_open__';
const OPEN_ACTION_PAGE_SIZE = 16;
const CMUX_TERMINAL_STARTUP_DELAY_MS = 350;
const yggtreeAccent = chalk.hex('#DEADED');

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

function openRail(): string {
    return yggtreeAccent('│');
}

function formatOpenColumns(name: string, command: string, detail: string): string {
    const paddedName = name.padEnd(16);
    const paddedCommand = command.padEnd(13);
    const row = `${openRail()}  ${chalk.bold(paddedName)} ${chalk.cyan(paddedCommand)}`;
    return detail ? `${row} ${chalk.dim(detail)}` : row;
}

export function formatOpenToolChoice(tool: OpenToolOption): string {
    return formatOpenColumns(tool.name, tool.command, '');
}

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}

function formatTerminalSessionName(wtPath: string): string {
    const basename = path.basename(wtPath) || 'worktree';
    const slug = basename.toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '');
    return `yggtree-${slug || 'worktree'}`.slice(0, 80);
}

export function buildTmuxLaunchCommand(wtPath: string, env: NodeJS.ProcessEnv = process.env): { executable: string; args: string[] } {
    const sessionName = formatTerminalSessionName(wtPath);
    if (env.TMUX) {
        return {
            executable: 'tmux',
            args: ['new-window', '-c', wtPath, '-n', sessionName],
        };
    }

    return {
        executable: 'tmux',
        args: ['new-session', '-A', '-s', sessionName, '-c', wtPath],
    };
}

export function buildCmuxNewPaneCommand(): { executable: string; args: string[] } {
    return {
        executable: 'cmux',
        args: ['new-pane', '--type', 'terminal', '--direction', 'right', '--focus', 'true'],
    };
}

export function parseCmuxSurfaceRef(output: string): string | undefined {
    return output.match(/\bsurface:\S+/)?.[0];
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function buildCmuxSendCommand(surfaceRef: string, wtPath: string): { executable: string; args: string[] } {
    return {
        executable: 'cmux',
        args: ['send', '--surface', surfaceRef, `cd ${shellQuote(wtPath)}`],
    };
}

export function buildCmuxEnterCommand(surfaceRef: string): { executable: string; args: string[] } {
    return {
        executable: 'cmux',
        args: ['send-key', '--surface', surfaceRef, 'Enter'],
    };
}

export function formatOpenSpecialChoice(value: typeof OTHER_COMMAND_ACTION | typeof NO_OPEN_ACTION, allowShellAction: boolean): string {
    if (value === OTHER_COMMAND_ACTION) {
        return formatOpenColumns('Other command', 'custom', 'run first, then stay in shell');
    }

    return allowShellAction
        ? formatOpenColumns('Nothing', 'skip', 'just enter the shell')
        : formatOpenColumns('Do not open', 'skip', 'return after selection');
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

function resolveWorktreeByName(worktrees: GitWorktree[], wtName: string, managedRoot: string): GitWorktree | undefined {
    return findWorktreeByName(worktrees, wtName, managedRoot);
}

export function resolveOpenToolOption(input: string, installed: OpenToolOption[]): OpenToolOption | undefined {
    const normalized = input.trim().toLowerCase();
    return installed.find(tool =>
        tool.id === normalized ||
        tool.command.toLowerCase() === normalized ||
        tool.aliases?.some(alias => alias.toLowerCase() === normalized)
    );
}

export function resolveOpenToolCandidate(input: string): OpenToolOption | undefined {
    const normalized = input.trim().toLowerCase();
    return OPEN_TOOL_CANDIDATES.find(tool =>
        tool.id === normalized ||
        tool.command.toLowerCase() === normalized ||
        tool.aliases?.some(alias => alias.toLowerCase() === normalized)
    );
}

async function resolveKnownOpenToolOption(input: string): Promise<OpenToolOption | undefined> {
    const candidate = resolveOpenToolCandidate(input);
    if (!candidate) return undefined;
    const exists = candidate.bundleId
        ? await macOSAppBundleExists(candidate.bundleId)
        : await commandExists(candidate.command);

    return exists ? candidate : undefined;
}

export async function resolveOpenToolAction(input: string, installed: OpenToolOption[]): Promise<OpenAction | undefined> {
    let chosenTool = resolveOpenToolOption(input, installed) || await resolveKnownOpenToolOption(input);
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
    const choices = installedTools
        .map(tool => ({
            name: formatOpenToolChoice(tool),
            value: tool,
        }));

    const { selectedTool } = await inquirer.prompt<{ selectedTool: OpenToolOption }>([
        {
            type: 'list',
            name: 'selectedTool',
            message,
            choices,
            loop: false,
            pageSize: OPEN_ACTION_PAGE_SIZE,
        },
    ]);

    return selectedTool;
}

export function buildOpenActionsFromSelection(
    selectedValue: string,
    installedTools: OpenToolOption[],
    otherCommand?: string,
): OpenAction[] {
    if (selectedValue === NO_OPEN_ACTION) return [];

    if (selectedValue.startsWith('tool:')) {
        const tool = installedTools.find(candidate => `tool:${candidate.id}` === selectedValue);
        return tool ? [{ type: 'tool', tool }] : [];
    }

    if (selectedValue === OTHER_COMMAND_ACTION && otherCommand?.trim()) {
        return [{ type: 'other-command', command: otherCommand.trim() }];
    }

    return [];
}

interface OpenActionPromptChoice {
    name: string;
    value: string;
}

export function buildOpenActionChoices(installedTools: OpenToolOption[], allowShellAction: boolean): OpenActionPromptChoice[] {
    const choices: OpenActionPromptChoice[] = installedTools.map(tool => ({
        name: formatOpenToolChoice(tool),
        value: `tool:${tool.id}`,
    }));

    if (allowShellAction) {
        choices.push({
            name: formatOpenSpecialChoice(OTHER_COMMAND_ACTION, allowShellAction),
            value: OTHER_COMMAND_ACTION,
        });
    }

    choices.push({
        name: formatOpenSpecialChoice(NO_OPEN_ACTION, allowShellAction),
        value: NO_OPEN_ACTION,
    });

    return choices;
}

export async function promptOpenActions(
    installedTools: OpenToolOption[],
    options: { message?: string; allowShellAction?: boolean } = {},
): Promise<OpenAction[]> {
    const allowShellAction = options.allowShellAction ?? true;
    const choices = buildOpenActionChoices(installedTools, allowShellAction);

    const { selectedValue } = await inquirer.prompt<{ selectedValue: string }>([
        {
            type: 'list',
            name: 'selectedValue',
            message: options.message || 'Open anything before entering the shell?',
            choices,
            loop: false,
            pageSize: OPEN_ACTION_PAGE_SIZE,
        },
    ]);

    let otherCommand: string | undefined;
    if (selectedValue === OTHER_COMMAND_ACTION) {
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

    return buildOpenActionsFromSelection(selectedValue, installedTools, otherCommand);
}

export async function launchOpenTool(tool: OpenToolOption, wtPath: string): Promise<void> {
    if (tool.id === 'cmux') {
        const newPaneCommand = buildCmuxNewPaneCommand();
        const newPaneResult = await execa(newPaneCommand.executable, newPaneCommand.args, {
            cwd: wtPath,
        });
        const surfaceRef = parseCmuxSurfaceRef(newPaneResult.stdout);
        if (!surfaceRef) {
            throw new Error(`Cmux did not return a terminal surface handle: ${newPaneResult.stdout || '<empty output>'}`);
        }

        await delay(CMUX_TERMINAL_STARTUP_DELAY_MS);

        const sendCommand = buildCmuxSendCommand(surfaceRef, wtPath);
        await execa(sendCommand.executable, sendCommand.args, {
            cwd: wtPath,
            stdio: 'ignore',
        });

        const enterCommand = buildCmuxEnterCommand(surfaceRef);
        await execa(enterCommand.executable, enterCommand.args, {
            cwd: wtPath,
            stdio: 'ignore',
        });
        return;
    }

    if (tool.id === 'tmux') {
        const { executable, args } = buildTmuxLaunchCommand(wtPath);
        await execa(executable, args, {
            cwd: wtPath,
            stdio: 'inherit',
        });
        return;
    }

    const { executable, args } = buildOpenToolLaunchCommand(tool, wtPath);

    await execa(executable, args, {
        cwd: wtPath,
        stdio: 'ignore',
    });
}

export function buildOpenToolLaunchCommand(tool: OpenToolOption, wtPath: string): { executable: string; args: string[] } {
    if (tool.id === 'codex-app') {
        return {
            executable: 'codex',
            args: ['app', wtPath],
        };
    }

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
    let openedTerminal = false;

    for (const action of actions) {
        if (action.type === 'tool' && action.tool) {
            log.info(`Opening ${ui.path(wtPath)} in ${chalk.cyan(action.tool.name)}...`);
            await launchOpenTool(action.tool, wtPath);
            if (action.tool.kind === 'terminal') {
                openedTerminal = true;
            }
        }
    }

    const shellAction = actions.find(action => action.type === 'other-command');
    if (shellAction?.command) {
        await enterCommand(wtPath, { exec: shellAction.command });
        return;
    }

    if (options.enter !== false && !openedTerminal) {
        await enterCommand(wtPath);
    }
}

export async function openCommand(wtName?: string, options: OpenOptions = {}) {
    try {
        await getRepoRoot();
        const worktrees = await listWorktrees();
        const mainWorktreePath = worktrees[0]?.path || '';
        const managedRoot = await getManagedWorktreesRoot();

        if (worktrees.length === 0) {
            log.info('No worktrees found.');
            return;
        }

        let targetWt: GitWorktree | undefined;
        if (wtName) {
            targetWt = resolveWorktreeByName(worktrees, wtName, managedRoot);
            if (!targetWt) {
                log.error(`Worktree "${wtName}" not found.`);
                return;
            }
        } else {
            ensureAutocompletePrompt();
            const terminalColumns = process.stdout.columns || 100;
            const candidates: OpenWorktreeCandidate[] = await Promise.all(worktrees.map(async (wt) => {
                const type = await detectWorktreeType(wt, mainWorktreePath, managedRoot);
                const branchName = getWorktreeBranchName(wt);
                const displayPath = formatWorktreeDisplayPath(wt.path, managedRoot);
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
