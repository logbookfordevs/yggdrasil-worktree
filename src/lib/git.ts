import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { log } from './ui.js';

export async function getRepoRoot(): Promise<string> {
    try {
        const { stdout } = await execa('git', ['rev-parse', '--show-toplevel']);
        return stdout.trim();
    } catch (error) {
        throw new Error('Not a git repository');
    }
}

export async function getRepoName(): Promise<string> {
    const root = await getRepoRoot();
    return path.basename(root);
}

export async function getCurrentBranch(): Promise<string> {
    try {
        const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
        return stdout.trim();
    } catch {
        return '';
    }
}

export async function verifyRef(ref: string): Promise<boolean> {
    try {
        await execa('git', ['rev-parse', '--verify', ref]);
        return true;
    } catch {
        return false;
    }
}

export async function fetchAll(): Promise<void> {
    await execa('git', ['fetch', '--all', '--prune']);
}

export async function createWorktree(wtPath: string, ref: string): Promise<void> {
    await fs.ensureDir(path.dirname(wtPath));
    await execa('git', ['worktree', 'add', wtPath, ref]);
}

export async function removeWorktree(wtPath: string): Promise<void> {
    await execa('git', ['worktree', 'remove', wtPath, '--force']);
}

export async function listWorktrees(): Promise<{ path: string; HEAD: string; branch?: string }[]> {
    const { stdout } = await execa('git', ['worktree', 'list', '--porcelain']);
    const worktrees: { path: string; HEAD: string; branch?: string }[] = [];
    
    let currentWt: any = {};
    
    for (const line of stdout.split('\n')) {
        if (!line) {
            if (currentWt.path) worktrees.push(currentWt);
            currentWt = {};
            continue;
        }
        
        const [key, ...rest] = line.split(' ');
        const value = rest.join(' ');
        
        if (key === 'worktree') currentWt.path = value;
        if (key === 'HEAD') currentWt.HEAD = value;
        if (key === 'branch') currentWt.branch = value.replace('refs/heads/', '');
    }
    
    // Push the last one if active
    if (currentWt.path) worktrees.push(currentWt);
    
    return worktrees;
}

export async function pruneWorktrees(): Promise<void> {
    await execa('git', ['worktree', 'prune']);
}

export async function syncSubmodules(cwd: string): Promise<void> {
    await execa('git', ['submodule', 'sync', '--recursive'], { cwd });
    await execa('git', ['submodule', 'update', '--init', '--recursive'], { cwd });
}
