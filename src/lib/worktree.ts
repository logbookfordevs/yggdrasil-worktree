import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { GitWorktree } from './git.js';
import { WORKTREES_ROOT } from './paths.js';
import { getSandboxMetaPath } from './sandbox.js';

export type WorktreeType = 'MAIN' | 'MANAGED' | 'SANDBOX' | 'LINKED';

export const WORKTREE_TYPE_ORDER: Record<WorktreeType, number> = {
    MAIN: 0,
    MANAGED: 1,
    SANDBOX: 2,
    LINKED: 3,
};

export function getWorktreeBranchName(worktree: GitWorktree): string {
    return worktree.branch || worktree.HEAD || 'detached';
}

export function isManagedWorktreePath(worktreePath: string): boolean {
    return worktreePath.startsWith(WORKTREES_ROOT);
}

export function formatWorktreeDisplayPath(worktreePath: string): string {
    if (isManagedWorktreePath(worktreePath)) {
        return path.relative(WORKTREES_ROOT, worktreePath);
    }
    return worktreePath.replace(process.env.HOME || '', '~');
}

export function findWorktreeByName(worktrees: GitWorktree[], worktreeName: string): GitWorktree | undefined {
    return worktrees.find(worktree => {
        const branchName = getWorktreeBranchName(worktree);
        const relativePath = path.relative(WORKTREES_ROOT, worktree.path);
        const basename = path.basename(worktree.path);
        return branchName === worktreeName ||
            relativePath === worktreeName ||
            worktree.path === worktreeName ||
            basename === worktreeName;
    });
}

export async function detectWorktreeType(worktree: GitWorktree, mainWorktreePath: string): Promise<WorktreeType> {
    const isManaged = isManagedWorktreePath(worktree.path);
    if (!isManaged) {
        return worktree.path === mainWorktreePath ? 'MAIN' : 'LINKED';
    }

    const hasSandboxMeta = await fs.pathExists(getSandboxMetaPath(worktree.path));
    const isSandboxBranch = (worktree.branch || '').startsWith('sandbox-');
    return hasSandboxMeta || isSandboxBranch ? 'SANDBOX' : 'MANAGED';
}

export function formatWorktreeType(type: WorktreeType): string {
    if (type === 'SANDBOX') return chalk.magenta('SANDBOX');
    if (type === 'MANAGED') return chalk.green('MANAGED');
    if (type === 'MAIN') return chalk.blue('MAIN   ');
    return chalk.cyan('LINKED ');
}
