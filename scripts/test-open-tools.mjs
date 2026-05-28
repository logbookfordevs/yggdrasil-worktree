import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yggtree-open-tools-'));

function createExecutable(command) {
    const filePath = path.join(tempDir, command);
    fs.writeFileSync(filePath, '#!/usr/bin/env sh\nexit 0\n', 'utf8');
    fs.chmodSync(filePath, 0o755);
}

createExecutable('agy');
createExecutable('gemini');

const originalPath = process.env.PATH || '';
process.env.PATH = [tempDir, originalPath].filter(Boolean).join(path.delimiter);

const openModule = await import('../dist/commands/wt/open.js');
const installedTools = await openModule.detectInstalledOpenTools();

const detectedCommands = installedTools.map(tool => tool.command);
assert.ok(detectedCommands.includes('agy'), 'detects agy when available in PATH');
assert.ok(!detectedCommands.includes('gemini'), 'does not include deprecated Gemini CLI in built-in open options');

const agyTool = openModule.resolveOpenToolOption('antigravity', installedTools);
assert.ok(agyTool, 'resolves antigravity alias to agy');
assert.equal(agyTool.command, 'agy');
assert.equal(agyTool.kind, 'agent');
assert.equal(openModule.isAgentTool(agyTool), true);
assert.equal(openModule.buildAgentExecCommand(agyTool), 'agy');

const customZedTool = openModule.parseCustomOpenCommand('zed .');
assert.deepEqual(customZedTool, {
    id: 'custom',
    name: 'zed .',
    command: 'zed',
    kind: 'ide',
    args: ['.'],
});
assert.deepEqual(
    openModule.buildIdeOpenArgs(customZedTool, '/tmp/yggtree/example-worktree'),
    ['/tmp/yggtree/example-worktree'],
    'replaces dot placeholders with the selected worktree path'
);

const customDroidTool = openModule.parseCustomOpenCommand('droid --profile warm');
assert.equal(customDroidTool.kind, 'agent', 'preserves TTY handling for custom Droid commands');
assert.equal(
    openModule.buildAgentExecCommand(customDroidTool),
    'droid --profile warm',
    'passes custom Droid arguments through the enter command path'
);

const customGeminiTool = openModule.parseCustomOpenCommand('gemini --model "gemini-2.5-pro"');
assert.equal(customGeminiTool.kind, 'agent', 'preserves TTY handling for custom Gemini commands');
assert.equal(
    openModule.buildAgentExecCommand(customGeminiTool),
    "gemini --model gemini-2.5-pro",
    'passes custom agent arguments through the enter command path'
);

const customClaudeTool = openModule.parseCustomOpenCommand('claude --dangerously-skip-permissions');
assert.equal(customClaudeTool.kind, 'agent', 'preserves TTY handling for custom Claude commands');
assert.equal(
    openModule.buildAgentExecCommand(customClaudeTool),
    'claude --dangerously-skip-permissions'
);

const customCodexTool = openModule.parseCustomOpenCommand('codex --model "gpt 5"');
assert.equal(customCodexTool.kind, 'agent', 'preserves TTY handling for custom Codex commands');
assert.equal(
    openModule.buildAgentExecCommand(customCodexTool),
    "codex --model 'gpt 5'",
    'quotes custom agent arguments that need shell escaping'
);

const customPiTool = openModule.parseCustomOpenCommand('pi --mode fast');
assert.equal(customPiTool.kind, 'agent', 'preserves TTY handling for custom Pi commands');
assert.equal(openModule.buildAgentExecCommand(customPiTool), 'pi --mode fast');

const customCursorAgentTool = openModule.parseCustomOpenCommand('cursor-agent --force');
assert.equal(customCursorAgentTool.kind, 'agent', 'preserves TTY handling for custom Cursor Agent commands');
assert.equal(openModule.buildAgentExecCommand(customCursorAgentTool), 'cursor-agent --force');

console.log('open tool options tests passed');
