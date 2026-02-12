import crypto from 'crypto';
import path from 'path';
import fs from 'fs-extra';

export interface SandboxMeta {
    originPath: string;
    originBranch: string;
    createdAt: string;
    appliedFiles?: AppliedFileBackup[];
}

export interface AppliedFileBackup {
    relativePath: string;
    originalContent: string | null; // null means file didn't exist
}

export const SANDBOX_META_FILE = '.sandbox-meta.json';

/**
 * Generate a sandbox worktree name: <branch>_<4-char-hash>
 */
export function generateSandboxName(branch: string): string {
    const hash = crypto.randomBytes(2).toString('hex'); // 4 hex chars
    const safeBranch = branch.replace(/[\\/]/g, '-');
    return `sandbox-${hash}_${safeBranch}`;
}

/**
 * Get the path to the sandbox metadata file
 */
export function getSandboxMetaPath(wtPath: string): string {
    return path.join(wtPath, SANDBOX_META_FILE);
}

/**
 * Write sandbox metadata to the worktree
 */
export async function writeSandboxMeta(wtPath: string, meta: SandboxMeta): Promise<void> {
    const metaPath = getSandboxMetaPath(wtPath);
    await fs.writeJSON(metaPath, meta, { spaces: 2 });
}

/**
 * Read sandbox metadata from a worktree
 */
export async function readSandboxMeta(wtPath: string): Promise<SandboxMeta | null> {
    const metaPath = getSandboxMetaPath(wtPath);
    if (await fs.pathExists(metaPath)) {
        try {
            return await fs.readJSON(metaPath);
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Check if the current directory is inside a sandbox worktree
 */
export async function isSandboxWorktree(cwd: string): Promise<boolean> {
    const meta = await readSandboxMeta(cwd);
    return meta !== null;
}

/**
 * Find the sandbox root from any subdirectory
 */
export async function findSandboxRoot(startPath: string): Promise<string | null> {
    let current = startPath;
    const root = path.parse(current).root;
    
    while (current !== root) {
        if (await fs.pathExists(getSandboxMetaPath(current))) {
            return current;
        }
        current = path.dirname(current);
    }
    return null;
}
