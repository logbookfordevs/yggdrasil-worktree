import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
export async function getRepoRoot() {
    try {
        const { stdout } = await execa('git', ['rev-parse', '--show-toplevel']);
        return stdout.trim();
    }
    catch (error) {
        throw new Error('Not a git repository');
    }
}
export async function verifyRef(ref) {
    try {
        await execa('git', ['rev-parse', '--verify', ref]);
        return true;
    }
    catch {
        return false;
    }
}
export async function fetchAll() {
    await execa('git', ['fetch', '--all', '--prune']);
}
export async function createWorktree(wtPath, ref) {
    await fs.ensureDir(path.dirname(wtPath));
    await execa('git', ['worktree', 'add', wtPath, ref]);
}
export async function removeWorktree(wtPath) {
    await execa('git', ['worktree', 'remove', wtPath, '--force']);
}
export async function listWorktrees() {
    const { stdout } = await execa('git', ['worktree', 'list', '--porcelain']);
    const worktrees = [];
    let currentWt = {};
    for (const line of stdout.split('\n')) {
        if (!line) {
            if (currentWt.path)
                worktrees.push(currentWt);
            currentWt = {};
            continue;
        }
        const [key, ...rest] = line.split(' ');
        const value = rest.join(' ');
        if (key === 'worktree')
            currentWt.path = value;
        if (key === 'HEAD')
            currentWt.HEAD = value;
        if (key === 'branch')
            currentWt.branch = value.replace('refs/heads/', '');
    }
    // Push the last one if active
    if (currentWt.path)
        worktrees.push(currentWt);
    return worktrees;
}
export async function pruneWorktrees() {
    await execa('git', ['worktree', 'prune']);
}
export async function syncSubmodules(cwd) {
    await execa('git', ['submodule', 'sync', '--recursive'], { cwd });
    await execa('git', ['submodule', 'update', '--init', '--recursive'], { cwd });
}
