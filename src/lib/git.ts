import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { log } from './ui.js';
import chalk from 'chalk';

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
export async function isGitClean(cwd: string): Promise<boolean> {
    try {
        const { stdout } = await execa('git', ['status', '--porcelain'], { cwd });
        return stdout.trim().length === 0;
    } catch {
        return false;
    }
}

/**
 * Ensures the branch in the given worktree path tracks origin/<branchName>.
 * If it tracks a different base branch (e.g. origin/main), it unsets it and publishes to origin.
 * Fails if origin/<branchName> already exists on remote and is not already the upstream.
 */
export async function ensureCorrectUpstream(wtPath: string, branchName: string): Promise<void> {
    const desiredUpstream = `origin/${branchName}`;
    let currentUpstream = '';

    try {
        const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: wtPath });
        currentUpstream = stdout.trim();
    } catch {
        // No upstream set
    }

    if (currentUpstream === desiredUpstream) {
        return; // Already correct
    }

    // If it's set to something else, unset it
    if (currentUpstream) {
        log.info(`Incorrect upstream detected: ${currentUpstream}. Unsetting...`);
        await execa('git', ['branch', '--unset-upstream'], { cwd: wtPath });
    }

    // Check if remote branch already exists
    const remoteExists = await verifyRef(desiredUpstream);
    if (remoteExists) {
        throw new Error(`Remote branch '${desiredUpstream}' already exists. Cannot publish safely without more info. Use 'git push -u origin HEAD' manually if you want to link them.`);
    }

    log.info(`Publishing branch ${chalk.cyan(branchName)} to ${chalk.cyan(desiredUpstream)}...`);
    await execa('git', ['push', '-u', 'origin', 'HEAD'], { cwd: wtPath });
}
