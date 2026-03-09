import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { log } from './ui.js';
import chalk from 'chalk';

export interface GitWorktree {
    path: string;
    HEAD: string;
    branch?: string;
}

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

export async function listWorktrees(): Promise<GitWorktree[]> {
    const { stdout } = await execa('git', ['worktree', 'list', '--porcelain']);
    const worktrees: GitWorktree[] = [];
    
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
 * Safety net: ensures the branch does NOT track an incorrect upstream
 * (e.g. origin/main when the branch is feat/new-thing).
 *
 * - Correct tracking (origin/<branchName>) → no-op
 * - No tracking at all → no-op
 * - Wrong tracking → unsets it
 */
export async function ensureCorrectUpstream(wtPath: string, branchName: string): Promise<void> {
    const desiredUpstream = `origin/${branchName}`;
    let currentUpstream = '';

    try {
        const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: wtPath });
        currentUpstream = stdout.trim();
    } catch {
        // No upstream set — safe
        return;
    }

    if (currentUpstream === desiredUpstream) {
        return; // Already correct
    }

    // Wrong tracking — kill it
    log.warning(`Incorrect upstream detected: ${chalk.red(currentUpstream)} (expected ${chalk.cyan(desiredUpstream)}). Unsetting...`);
    await execa('git', ['branch', '--unset-upstream'], { cwd: wtPath });
}

/**
 * Publishes a local branch to origin and sets upstream tracking.
 * Skips if the branch is already published (origin/<branchName> exists and is tracked).
 */
export async function publishBranch(wtPath: string, branchName: string): Promise<void> {
    const desiredUpstream = `origin/${branchName}`;

    // Check if already tracking the correct remote
    try {
        const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: wtPath });
        if (stdout.trim() === desiredUpstream) {
            return; // Already published and tracked
        }
    } catch {
        // No upstream — expected for new branches
    }

    log.info(`Publishing ${chalk.cyan(branchName)} → ${chalk.cyan(desiredUpstream)}...`);
    await execa('git', ['push', '-u', 'origin', 'HEAD'], { cwd: wtPath });
}

/**
 * Returns the most recent activity date for a worktree by checking two signals:
 * 1. Last commit time (captures committed work)
 * 2. Git index mtime (captures staging, checkouts, uncommitted work)
 *
 * The most recent of the two wins. Returns null if both fail.
 */
// ── PR Status (requires `gh` CLI — gracefully degrades) ─────────────────────

export type PrState = 'open' | 'merged' | 'closed' | 'draft';
export type PrReviewDecision = 'approved' | 'changes_requested' | 'review_required' | null;

export interface PrStatus {
    state: PrState;
    reviewDecision: PrReviewDecision;
    /** Human-friendly label for display */
    label: string;
    number: number;
}

let ghAvailableCache: boolean | null = null;

/**
 * Check whether `gh` CLI is installed and authenticated.
 * Result is cached for the process lifetime.
 */
export async function isGhAvailable(): Promise<boolean> {
    if (ghAvailableCache !== null) return ghAvailableCache;

    try {
        await execa('gh', ['auth', 'status'], { stdio: 'ignore' });
        ghAvailableCache = true;
    } catch {
        ghAvailableCache = false;
    }
    return ghAvailableCache;
}

function derivePrLabel(state: PrState, reviewDecision: PrReviewDecision): string {
    if (state === 'merged') return 'MERGED';
    if (state === 'closed') return 'CLOSED';
    if (state === 'draft') return 'DRAFT';

    // state === 'open'
    if (reviewDecision === 'approved') return 'APPROVED';
    if (reviewDecision === 'changes_requested') return 'CHANGES';
    if (reviewDecision === 'review_required') return 'IN REVIEW';

    return 'OPEN';
}

/**
 * Fetch PR status for a branch using `gh pr view`.
 * Returns null when `gh` is unavailable or the branch has no PR.
 */
export async function getPrStatusForBranch(branch: string, cwd?: string): Promise<PrStatus | null> {
    if (!branch || branch === 'detached') return null;

    try {
        const { stdout } = await execa(
            'gh',
            ['pr', 'view', branch, '--json', 'state,reviewDecision,isDraft,number'],
            { cwd, timeout: 10_000 },
        );

        const data = JSON.parse(stdout);
        const isDraft = data.isDraft === true;
        const rawState = (data.state || '').toLowerCase() as PrState;
        const state: PrState = isDraft && rawState === 'open' ? 'draft' : rawState;
        const reviewDecision = (data.reviewDecision || '').toLowerCase().replace(/ /g, '_') as PrReviewDecision || null;

        return {
            state,
            reviewDecision,
            label: derivePrLabel(state, reviewDecision),
            number: data.number,
        };
    } catch {
        return null;
    }
}

/**
 * Batch-fetch PR statuses for all provided branches (parallelized).
 * Returns a Map<branchName, PrStatus>.
 * If `gh` is unavailable, returns an empty map immediately.
 */
export async function getPrStatusBatch(branches: string[], cwd?: string): Promise<Map<string, PrStatus>> {
    const map = new Map<string, PrStatus>();

    if (!(await isGhAvailable())) return map;

    const results = await Promise.all(
        branches.map(async branch => {
            const status = await getPrStatusForBranch(branch, cwd);
            return { branch, status };
        }),
    );

    for (const { branch, status } of results) {
        if (status) map.set(branch, status);
    }

    return map;
}

export async function getLastActivity(wtPath: string): Promise<Date | null> {
    const dates: Date[] = [];

    // Signal 1 — last commit epoch
    try {
        const { stdout } = await execa('git', ['log', '-1', '--format=%ct'], { cwd: wtPath });
        const epoch = parseInt(stdout.trim(), 10);
        if (!isNaN(epoch)) {
            dates.push(new Date(epoch * 1000));
        }
    } catch {
        // no commits reachable — skip
    }

    // Signal 2 — git index file mtime
    try {
        const { stdout: gitDir } = await execa('git', ['rev-parse', '--git-dir'], { cwd: wtPath });
        const gitDirPath = gitDir.trim();
        const resolvedGitDir = path.isAbsolute(gitDirPath) ? gitDirPath : path.join(wtPath, gitDirPath);
        const indexPath = path.join(resolvedGitDir, 'index');
        const stat = await fs.stat(indexPath);
        dates.push(stat.mtime);
    } catch {
        // index not found — skip
    }

    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map(d => d.getTime())));
}
