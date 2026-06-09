import { describe, expect, it } from 'vitest';
import {
    buildCmuxEnterCommand,
    buildCmuxNewPaneCommand,
    buildCmuxSendCommand,
    buildOpenActionChoices,
    buildOpenToolLaunchCommand,
    buildOpenActionsFromSelection,
    buildTmuxLaunchCommand,
    formatOpenSpecialChoice,
    formatOpenToolChoice,
    isOpenToolAvailable,
    OPEN_TOOL_CANDIDATES,
    OpenToolOption,
    parseCmuxSurfaceRef,
    resolveOpenToolCandidate,
    resolveOpenToolOption,
} from '../src/commands/wt/open.js';

const cursorTool: OpenToolOption = {
    id: 'cursor',
    name: 'Cursor',
    command: 'cursor',
    kind: 'editor',
};

const codeTool: OpenToolOption = {
    id: 'code',
    name: 'VS Code',
    command: 'code',
    kind: 'editor',
};

const codexAppTool: OpenToolOption = {
    id: 'codex-app',
    name: 'Codex App',
    command: 'codex-app',
    kind: 'app',
    aliases: ['codex', 'codex-app'],
    bundleId: 'com.openai.codex',
    requiredCommand: 'codex',
};

const tmuxTool: OpenToolOption = {
    id: 'tmux',
    name: 'Tmux Session',
    command: 'tmux',
    kind: 'terminal',
    aliases: ['tmux', 'tmux-session'],
};

describe('open action selection', () => {
    it('builds one editor action from one selection', () => {
        const actions = buildOpenActionsFromSelection(
            'tool:cursor',
            [cursorTool, codeTool],
        );

        expect(actions).toEqual([
            { type: 'tool', tool: cursorTool },
        ]);
    });

    it('builds terminal actions from the same open picker selection', () => {
        const actions = buildOpenActionsFromSelection(
            'tool:tmux',
            [tmuxTool],
        );

        expect(actions).toEqual([
            { type: 'tool', tool: tmuxTool },
        ]);
    });

    it('maps Other command to a shell startup command', () => {
        const actions = buildOpenActionsFromSelection(
            '__other_command__',
            [cursorTool],
            'claude',
        );

        expect(actions).toEqual([
            { type: 'other-command', command: 'claude' },
        ]);
    });

    it('maps Nothing to no actions', () => {
        expect(buildOpenActionsFromSelection('__no_open__', [cursorTool])).toEqual([]);
    });

    it('keeps the open prompt as one flat list with terminal tools before shell actions', () => {
        const choices = buildOpenActionChoices([cursorTool, codexAppTool, tmuxTool], true);

        expect(choices.map(choice => choice.value)).toEqual([
            'tool:cursor',
            'tool:codex-app',
            'tool:tmux',
            '__other_command__',
            '__no_open__',
        ]);
    });

    it('keeps agent CLIs out while allowing Codex App as a macOS app opener', () => {
        expect(OPEN_TOOL_CANDIDATES.map(tool => tool.id)).not.toEqual(
            expect.arrayContaining(['claude', 'gemini', 'opencode', 'agy']),
        );
        expect(OPEN_TOOL_CANDIDATES.find(tool => tool.id === 'codex-app')).toMatchObject({
            name: 'Codex App',
            kind: 'app',
            bundleId: 'com.openai.codex',
        });
        expect(OPEN_TOOL_CANDIDATES.find(tool => tool.id === 'cmux')).toMatchObject({
            name: 'Cmux Panel',
            kind: 'terminal',
        });
        expect(OPEN_TOOL_CANDIDATES.find(tool => tool.id === 'tmux')).toMatchObject({
            name: 'Tmux Session',
            kind: 'terminal',
        });
    });

    it('launches Codex App through the Codex CLI so the worktree becomes the active project', () => {
        expect(buildOpenToolLaunchCommand(codexAppTool, '/tmp/worktree')).toEqual({
            executable: 'codex',
            args: ['app', '/tmp/worktree'],
        });
    });

    it('resolves codex aliases to Codex App when the app is installed', () => {
        expect(resolveOpenToolOption('codex', [codexAppTool])).toBe(codexAppTool);
        expect(resolveOpenToolOption('codex-app', [codexAppTool])).toBe(codexAppTool);
    });

    it('requires the Codex CLI before offering Codex App launch', async () => {
        await expect(isOpenToolAvailable(codexAppTool, {
            commandExists: async () => false,
            macOSAppBundleExists: async () => true,
        })).resolves.toBe(false);

        await expect(isOpenToolAvailable(codexAppTool, {
            commandExists: async (command: string) => command === 'codex',
            macOSAppBundleExists: async () => true,
        })).resolves.toBe(true);
    });

    it('resolves tmux aliases when tmux is installed', () => {
        expect(resolveOpenToolOption('tmux-session', [tmuxTool])).toBe(tmuxTool);
    });

    it('finds known terminal tool metadata before custom command fallback', () => {
        expect(resolveOpenToolCandidate('cmux')).toMatchObject({
            id: 'cmux',
            kind: 'terminal',
        });
    });

    it('builds tmux launch commands for attached and unattached terminals', () => {
        expect(buildTmuxLaunchCommand('/tmp/My Worktree', {})).toEqual({
            executable: 'tmux',
            args: ['new-session', '-A', '-s', 'yggtree-my-worktree', '-c', '/tmp/My Worktree'],
        });
        expect(buildTmuxLaunchCommand('/tmp/My Worktree', { TMUX: '/tmp/tmux-1000/default,1,0' })).toEqual({
            executable: 'tmux',
            args: ['new-window', '-c', '/tmp/My Worktree', '-n', 'yggtree-my-worktree'],
        });
    });

    it('builds cmux pane and explicit surface command-entry commands', () => {
        expect(buildCmuxNewPaneCommand()).toEqual({
            executable: 'cmux',
            args: ['new-pane', '--type', 'terminal', '--direction', 'right', '--focus', 'true'],
        });
        expect(parseCmuxSurfaceRef('OK surface:13 pane:8 workspace:3')).toBe('surface:13');
        expect(buildCmuxSendCommand('surface:13', "/tmp/user's repo")).toEqual({
            executable: 'cmux',
            args: ['send', '--surface', 'surface:13', "cd '/tmp/user'\\''s repo'"],
        });
        expect(buildCmuxEnterCommand('surface:13')).toEqual({
            executable: 'cmux',
            args: ['send-key', '--surface', 'surface:13', 'Enter'],
        });
    });

    it('formats open picker rows with a left-rail layout', () => {
        expect(formatOpenToolChoice(codexAppTool)).toContain('Codex App');
        expect(formatOpenToolChoice(codexAppTool)).toContain('codex-app');
        expect(formatOpenToolChoice(codexAppTool)).not.toContain(' app');
        expect(formatOpenToolChoice(tmuxTool)).toContain('Tmux Session');
        expect(formatOpenToolChoice(codexAppTool)).toContain('│');
        expect(formatOpenSpecialChoice('__other_command__', true)).toContain('Other command');
        expect(formatOpenSpecialChoice('__no_open__', true)).toContain('just enter the shell');
        expect(formatOpenSpecialChoice('__no_open__', false)).toContain('Do not open');
    });
});
