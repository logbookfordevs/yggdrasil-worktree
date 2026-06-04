import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import {
    findExistingBranchWorktree,
    getWorktreePathCollisionMessage,
    listBranchCandidates,
} from '../src/commands/wt/create.js';
import { parseWorktreeList } from '../src/lib/git.js';

const exec = promisify(execFile);

async function git(cwd: string, args: string[]): Promise<void> {
    await exec('git', args, { cwd });
}

async function commitFile(repo: string, file: string, content: string, message: string): Promise<void> {
    await writeFile(path.join(repo, file), content);
    await git(repo, ['add', file]);
    await git(repo, ['commit', '-m', message]);
}

async function createBranchCandidateRepo(tmp: string): Promise<string> {
    const origin = path.join(tmp, 'origin.git');
    const repo = path.join(tmp, 'repo');

    await exec('git', ['init', '--bare', origin]);
    await exec('git', ['init', repo]);
    await git(repo, ['config', 'user.name', 'Yggtree Test']);
    await git(repo, ['config', 'user.email', 'yggtree-test@example.com']);

    await commitFile(repo, 'README.md', '# test\n', 'initial commit');
    await git(repo, ['branch', '-M', 'main']);
    await git(repo, ['remote', 'add', 'origin', origin]);
    await git(repo, ['push', '-u', 'origin', 'main']);

    await git(repo, ['checkout', '-b', 'development']);
    await commitFile(repo, 'development.txt', 'development\n', 'development branch');
    await git(repo, ['push', '-u', 'origin', 'development']);

    await git(repo, ['checkout', 'main']);
    await git(repo, ['checkout', '-b', 'local-only']);
    await commitFile(repo, 'local.txt', 'local\n', 'local branch');

    await git(repo, ['checkout', 'main']);
    await git(repo, ['checkout', '-b', 'remote-only']);
    await commitFile(repo, 'remote.txt', 'remote\n', 'remote branch');
    await git(repo, ['push', '-u', 'origin', 'remote-only']);
    await git(repo, ['checkout', 'main']);
    await git(repo, ['branch', '-D', 'remote-only']);
    await git(repo, ['fetch', '--all', '--prune']);

    return repo;
}

describe('worktree checkout branch candidates', () => {
    it('shows local, remote-tip, and remote-only branches with the right checkout behavior', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-branch-candidates-'));
        const previousCwd = process.cwd();

        try {
            const repo = await createBranchCandidateRepo(tmp);
            process.chdir(repo);
            const candidates = await listBranchCandidates();

            const developmentLocal = candidates.find(candidate =>
                candidate.branchName === 'development' &&
                candidate.checkoutRef === 'development'
            );
            expect(developmentLocal?.sourceLabel).toBe('local');
            expect(developmentLocal?.createLocalBranch).toBe(false);
            expect(developmentLocal?.attachedBranchName).toBe('development');

            const developmentRemote = candidates.find(candidate =>
                candidate.branchName === 'development' &&
                candidate.checkoutRef === 'origin/development'
            );
            expect(developmentRemote?.sourceLabel).toBe('remote tip, detached');
            expect(developmentRemote?.createLocalBranch).toBe(false);
            expect(developmentRemote?.attachedBranchName).toBeUndefined();

            const remoteOnly = candidates.find(candidate =>
                candidate.branchName === 'remote-only' &&
                candidate.checkoutRef === 'origin/remote-only'
            );
            expect(remoteOnly?.sourceLabel).toBe('remote, creates local branch');
            expect(remoteOnly?.createLocalBranch).toBe(true);
            expect(remoteOnly?.attachedBranchName).toBe('remote-only');

            const localOnlyRemote = candidates.find(candidate =>
                candidate.branchName === 'local-only' &&
                candidate.checkoutRef === 'origin/local-only'
            );
            expect(localOnlyRemote).toBeUndefined();
        } finally {
            process.chdir(previousCwd);
            await rm(tmp, { recursive: true, force: true });
        }
    });
});

describe('worktree checkout reuse', () => {
    it('preserves git prunable metadata from porcelain worktree output', () => {
        const parsedPrunableWorktrees = parseWorktreeList([
            'worktree /tmp/missing-development',
            'HEAD stale-head',
            'branch refs/heads/development',
            'prunable gitdir file points to non-existent location',
            '',
        ].join('\n'));

        expect(parsedPrunableWorktrees[0].prunable).toBe('gitdir file points to non-existent location');
    });

    it('reuses existing non-prunable worktrees for the selected branch', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-existing-worktree-'));

        try {
            const repo = path.join(tmp, 'repo');
            const externalDevelopmentPath = path.join(tmp, 'external-development');
            await mkdir(repo);
            await mkdir(externalDevelopmentPath);

            const existingBranchWorktree = findExistingBranchWorktree(
                [
                    { path: repo, HEAD: 'main-head', branch: 'main' },
                    { path: externalDevelopmentPath, HEAD: 'development-head', branch: 'development' },
                ],
                'development'
            );

            expect(existingBranchWorktree?.path).toBe(externalDevelopmentPath);
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });

    it('does not reuse prunable or missing-path worktrees', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-stale-worktree-'));

        try {
            const staleBranchWorktree = findExistingBranchWorktree(
                [
                    {
                        path: path.join(tmp, 'missing-development'),
                        HEAD: 'stale-head',
                        branch: 'development',
                        prunable: 'gitdir file points to non-existent location',
                    },
                ],
                'development'
            );

            expect(staleBranchWorktree).toBeUndefined();
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });

    it('reports when the default slug path is occupied by another branch', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-path-collision-'));

        try {
            const developmentPath = path.join(tmp, 'development');
            await mkdir(developmentPath);

            const collisionMessage = getWorktreePathCollisionMessage(
                'development',
                developmentPath,
                [
                    {
                        path: developmentPath,
                        HEAD: 'feature-head',
                        branch: 'feat/other-work',
                    },
                ],
            );

            expect(collisionMessage).toBe('Worktree name "development" is already used by branch "feat/other-work".');
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });
});

describe('worktree checkout CLI', () => {
    it('can checkout a branch non-interactively with explicit ref, name, and no shell entry', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-wc-cli-'));

        try {
            const repo = await createBranchCandidateRepo(tmp);
            const home = path.join(tmp, 'home');
            await mkdir(home);

            await exec(
                'node',
                [
                    path.resolve('dist/index.js'),
                    'wc',
                    '--ref',
                    'remote-only',
                    '--name',
                    'remote-only-checkout',
                    '--no-open',
                    '--no-enter',
                    '--no-bootstrap',
                ],
                {
                    cwd: repo,
                    env: {
                        ...process.env,
                        CI: 'true',
                        HOME: home,
                    },
                    timeout: 15_000,
                },
            );

            const worktreePath = path.join(home, '.yggtree', 'repo', 'remote-only-checkout');
            const { stdout } = await exec('git', ['branch', '--show-current'], { cwd: worktreePath });
            expect(stdout.trim()).toBe('remote-only');
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    });

    it('reports occupied worktree slug paths before git worktree add runs', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-wc-path-collision-cli-'));

        try {
            const repo = await createBranchCandidateRepo(tmp);
            const home = path.join(tmp, 'home');
            const occupiedPath = path.join(home, '.yggtree', 'repo', 'development');
            await mkdir(path.dirname(occupiedPath), { recursive: true });
            await git(repo, ['worktree', 'add', occupiedPath, 'local-only']);

            const { stdout } = await exec(
                'node',
                [
                    path.resolve('dist/index.js'),
                    'wc',
                    '--ref',
                    'development',
                    '--name',
                    'development',
                    '--no-open',
                    '--no-enter',
                    '--no-bootstrap',
                ],
                {
                    cwd: repo,
                    env: {
                        ...process.env,
                        CI: 'true',
                        HOME: home,
                    },
                    timeout: 15_000,
                },
            );

            expect(stdout).toContain('Worktree name "development" is already used by branch "local-only".');
            expect(stdout).not.toContain('fatal:');
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    }, 15_000);

    it('can checkout from outside a repo by using the registered repo reference', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-wc-registered-repo-'));

        try {
            const repo = await createBranchCandidateRepo(tmp);
            const home = path.join(tmp, 'home');
            const outsideRepo = path.join(tmp, 'outside');
            await mkdir(path.join(home, '.yggtree'), { recursive: true });
            await mkdir(outsideRepo);
            await writeFile(
                path.join(home, '.yggtree', 'registry.json'),
                JSON.stringify({ repos: { repo } }),
            );

            await exec(
                'node',
                [
                    path.resolve('dist/index.js'),
                    'wc',
                    '--ref',
                    'remote-only',
                    '--name',
                    'outside-repo-checkout',
                    '--no-open',
                    '--no-enter',
                    '--no-bootstrap',
                ],
                {
                    cwd: outsideRepo,
                    env: {
                        ...process.env,
                        CI: 'true',
                        HOME: home,
                    },
                    timeout: 15_000,
                },
            );

            const worktreePath = path.join(home, '.yggtree', 'repo', 'outside-repo-checkout');
            const { stdout } = await exec('git', ['branch', '--show-current'], { cwd: worktreePath });
            expect(stdout.trim()).toBe('remote-only');
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    }, 15_000);

    it('fails instead of prompting when outside a repo with multiple registered repos and no TTY', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-wc-multi-repo-no-tty-'));

        try {
            const repo = await createBranchCandidateRepo(tmp);
            const otherRepo = path.join(tmp, 'other-repo');
            const home = path.join(tmp, 'home');
            const outsideRepo = path.join(tmp, 'outside');
            await mkdir(otherRepo);
            await mkdir(path.join(home, '.yggtree'), { recursive: true });
            await mkdir(outsideRepo);
            await writeFile(
                path.join(home, '.yggtree', 'registry.json'),
                JSON.stringify({ repos: { repo, otherRepo } }),
            );

            try {
                await exec(
                    'node',
                    [
                        path.resolve('dist/index.js'),
                        'wc',
                        '--ref',
                        'remote-only',
                        '--name',
                        'outside-repo-checkout',
                        '--no-open',
                        '--no-enter',
                        '--no-bootstrap',
                    ],
                    {
                        cwd: outsideRepo,
                        env: {
                            ...process.env,
                            CI: 'true',
                            HOME: home,
                        },
                        timeout: 15_000,
                    },
                );
                throw new Error('Expected worktree checkout to fail before prompting');
            } catch (error) {
                const output = error instanceof Error && 'stdout' in error
                    ? String(error.stdout)
                    : '';
                expect(output).toContain('multiple registered realms are available');
                expect(output).toContain('Run yggtree from the repo you want to use');
            }
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    }, 15_000);

    it('can checkout and open a requested tool non-interactively without the open prompt', async () => {
        const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-wc-tool-cli-'));

        try {
            const repo = await createBranchCandidateRepo(tmp);
            const home = path.join(tmp, 'home');
            await mkdir(home);

            await exec(
                'node',
                [
                    path.resolve('dist/index.js'),
                    'wc',
                    '--ref',
                    'remote-only',
                    '--name',
                    'remote-only-with-tool',
                    '--tool',
                    'true',
                    '--no-enter',
                    '--no-bootstrap',
                ],
                {
                    cwd: repo,
                    env: {
                        ...process.env,
                        CI: 'true',
                        HOME: home,
                    },
                    timeout: 15_000,
                },
            );

            const worktreePath = path.join(home, '.yggtree', 'repo', 'remote-only-with-tool');
            const { stdout } = await exec('git', ['branch', '--show-current'], { cwd: worktreePath });
            expect(stdout.trim()).toBe('remote-only');
        } finally {
            await rm(tmp, { recursive: true, force: true });
        }
    }, 15_000);

    it('does not treat removed enter or close commands as interactive menu aliases', async () => {
        await expect(exec('node', [path.resolve('dist/index.js'), 'enter'])).rejects.toThrow(
            "unknown command 'enter'",
        );
        await expect(exec('node', [path.resolve('dist/index.js'), 'close'])).rejects.toThrow(
            "unknown command 'close'",
        );
    });

    it('preserves Commander implicit help commands', async () => {
        const help = await exec('node', [path.resolve('dist/index.js'), 'help']);
        expect(help.stdout).toContain('Usage: yggtree');

        const openHelp = await exec('node', [path.resolve('dist/index.js'), 'help', 'open']);
        expect(openHelp.stdout).toContain('Usage: yggtree open');
        expect(openHelp.stdout).toContain('Open a worktree in an editor or supported app');
    });
});
