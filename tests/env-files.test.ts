import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
    copyEnvFiles,
    findLocalEnvFiles,
    promptAndCopyEnvFiles,
    promptAndCopyEnvFilesToWorktrees,
} from '../src/lib/env-files.js';

async function writeFile(filePath: string, contents = ''): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contents);
}

describe('env file helpers', () => {
    it('finds local env files and skips examples', async () => {
        const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'yggtree-env-files-'));

        try {
            const repoRoot = path.join(tmpRoot, 'repo');
            await fs.mkdir(repoRoot, { recursive: true });
            await writeFile(path.join(repoRoot, '.env'), 'SECRET=one\n');
            await writeFile(path.join(repoRoot, '.env.local'), 'LOCAL=true\n');
            await writeFile(path.join(repoRoot, '.env.example'), 'EXAMPLE=true\n');
            await writeFile(path.join(repoRoot, 'README.md'), '# test\n');

            await expect(findLocalEnvFiles(repoRoot)).resolves.toEqual(['.env', '.env.local']);
        } finally {
            await fs.rm(tmpRoot, { recursive: true, force: true });
        }
    });

    it('copies selected env files to a worktree', async () => {
        const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'yggtree-env-files-'));

        try {
            const repoRoot = path.join(tmpRoot, 'repo');
            const worktreeRoot = path.join(tmpRoot, 'worktree');
            await fs.mkdir(worktreeRoot, { recursive: true });
            await writeFile(path.join(repoRoot, '.env'), 'SECRET=one\n');

            await copyEnvFiles(repoRoot, worktreeRoot, ['.env']);

            await expect(fs.readFile(path.join(worktreeRoot, '.env'), 'utf8')).resolves.toBe('SECRET=one\n');
        } finally {
            await fs.rm(tmpRoot, { recursive: true, force: true });
        }
    });

    it('skips interactive env-file prompts in CI mode', async () => {
        const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'yggtree-env-files-'));
        const previousCi = process.env.CI;
        process.env.CI = 'true';

        try {
            const repoRoot = path.join(tmpRoot, 'repo');
            const worktreeRoot = path.join(tmpRoot, 'worktree');
            const multiA = path.join(tmpRoot, 'multi-a');
            const multiB = path.join(tmpRoot, 'multi-b');
            await fs.mkdir(worktreeRoot, { recursive: true });
            await fs.mkdir(multiA, { recursive: true });
            await fs.mkdir(multiB, { recursive: true });
            await writeFile(path.join(repoRoot, '.env'), 'SECRET=one\n');

            await promptAndCopyEnvFiles(repoRoot, worktreeRoot, ['.env']);
            await expect(fs.access(path.join(worktreeRoot, '.env'))).rejects.toMatchObject({ code: 'ENOENT' });

            await promptAndCopyEnvFilesToWorktrees(repoRoot, [multiA, multiB], ['.env']);
            await expect(fs.access(path.join(multiA, '.env'))).rejects.toMatchObject({ code: 'ENOENT' });
            await expect(fs.access(path.join(multiB, '.env'))).rejects.toMatchObject({ code: 'ENOENT' });
        } finally {
            if (previousCi === undefined) {
                delete process.env.CI;
            } else {
                process.env.CI = previousCi;
            }
            await fs.rm(tmpRoot, { recursive: true, force: true });
        }
    });
});
