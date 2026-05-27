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
assert.deepEqual(
    openModule.buildIdeOpenArgs(customDroidTool, '/tmp/yggtree/example-worktree'),
    ['--profile', 'warm', '/tmp/yggtree/example-worktree'],
    'appends the selected worktree path when the custom command has no dot placeholder'
);

console.log('open tool options tests passed');
