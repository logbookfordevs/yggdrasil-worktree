import { describe, expect, it } from 'vitest';
import {
    buildOpenToolLaunchCommand,
    buildOpenActionsFromSelection,
    formatOpenSpecialChoice,
    formatOpenToolChoice,
    OPEN_TOOL_CANDIDATES,
    OpenToolOption,
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

    it('keeps agent CLIs out while allowing Codex App as a macOS app opener', () => {
        expect(OPEN_TOOL_CANDIDATES.map(tool => tool.id)).not.toEqual(
            expect.arrayContaining(['claude', 'gemini', 'opencode', 'agy']),
        );
        expect(OPEN_TOOL_CANDIDATES.find(tool => tool.id === 'codex-app')).toMatchObject({
            name: 'Codex App',
            kind: 'app',
            bundleId: 'com.openai.codex',
        });
    });

    it('launches macOS app tools by bundle id with the worktree path', () => {
        expect(buildOpenToolLaunchCommand(codexAppTool, '/tmp/worktree')).toEqual({
            executable: '/usr/bin/open',
            args: ['-b', 'com.openai.codex', '/tmp/worktree'],
        });
    });

    it('resolves codex aliases to Codex App when the app is installed', () => {
        expect(resolveOpenToolOption('codex', [codexAppTool])).toBe(codexAppTool);
        expect(resolveOpenToolOption('codex-app', [codexAppTool])).toBe(codexAppTool);
    });

    it('formats open picker rows with a left-rail layout', () => {
        expect(formatOpenToolChoice(codexAppTool)).toContain('Codex App');
        expect(formatOpenToolChoice(codexAppTool)).toContain('codex-app');
        expect(formatOpenToolChoice(codexAppTool)).not.toContain(' app');
        expect(formatOpenToolChoice(codexAppTool)).toContain('│');
        expect(formatOpenSpecialChoice('__other_command__', true)).toContain('Other command');
        expect(formatOpenSpecialChoice('__no_open__', true)).toContain('just enter the shell');
        expect(formatOpenSpecialChoice('__no_open__', false)).toContain('Do not open');
    });
});
