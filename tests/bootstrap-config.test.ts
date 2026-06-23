import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getBootstrapCommands } from '../src/lib/config.js';
import { hasRegisteredRepoPath } from '../src/lib/registry.js';

async function writeSetupConfig(root: string, commands: string[]): Promise<void> {
    const configPath = path.join(root, '.yggtree', 'worktree-setup.json');
    await mkdir(path.dirname(configPath), { recursive: true });
    await writeFile(configPath, JSON.stringify({ 'setup-worktree': commands }, null, 2));
}

describe('bootstrap config resolution', () => {
    it('returns null when no bootstrap config exists', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-bootstrap-config-'));

        try {
            const repoRoot = path.join(tmp, 'repo');
            const worktreePath = path.join(tmp, 'worktree');
            await mkdir(repoRoot, { recursive: true });
            await mkdir(worktreePath, { recursive: true });

            await expect(getBootstrapCommands(repoRoot, worktreePath)).resolves.toBeNull();
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });

    it('uses the worktree bootstrap config as a fallback', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-bootstrap-config-'));

        try {
            const repoRoot = path.join(tmp, 'repo');
            const worktreePath = path.join(tmp, 'worktree');
            await mkdir(repoRoot, { recursive: true });
            await writeSetupConfig(worktreePath, ['pnpm install']);

            await expect(getBootstrapCommands(repoRoot, worktreePath))
                .resolves.toEqual(['pnpm install']);
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });

    it('prefers repo config over worktree config', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-bootstrap-config-'));

        try {
            const repoRoot = path.join(tmp, 'repo');
            const worktreePath = path.join(tmp, 'worktree');
            await writeSetupConfig(repoRoot, ['pnpm install']);
            await writeSetupConfig(worktreePath, ['yarn install']);

            await expect(getBootstrapCommands(repoRoot, worktreePath))
                .resolves.toEqual(['pnpm install']);
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });
});

describe('repo registration checks', () => {
    it('matches registered repo paths by their real path', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-registered-repo-'));

        try {
            const repoRoot = path.join(tmp, 'repo');
            await mkdir(repoRoot, { recursive: true });

            await expect(hasRegisteredRepoPath(repoRoot, {
                repos: { repo: path.join(tmp, '.', 'repo') },
            })).resolves.toBe(true);
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });
});
