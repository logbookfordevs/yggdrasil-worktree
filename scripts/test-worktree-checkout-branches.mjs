import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { findExistingBranchWorktree, listBranchCandidates } from '../dist/commands/wt/create.js';

const exec = promisify(execFile);

async function git(cwd, args) {
  await exec('git', args, { cwd });
}

async function commitFile(repo, file, content, message) {
  await writeFile(path.join(repo, file), content);
  await git(repo, ['add', file]);
  await git(repo, ['commit', '-m', message]);
}

const tmp = await mkdtemp(path.join(os.tmpdir(), 'yggtree-branch-candidates-'));

try {
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

  const previousCwd = process.cwd();
  let candidates;
  try {
    process.chdir(repo);
    candidates = await listBranchCandidates();
  } finally {
    process.chdir(previousCwd);
  }

  const developmentLocal = candidates.find(candidate =>
    candidate.branchName === 'development' &&
    candidate.checkoutRef === 'development'
  );
  assert.equal(developmentLocal?.sourceLabel, 'local');
  assert.equal(developmentLocal?.createLocalBranch, false);
  assert.equal(developmentLocal?.attachedBranchName, 'development');

  const developmentRemote = candidates.find(candidate =>
    candidate.branchName === 'development' &&
    candidate.checkoutRef === 'origin/development'
  );
  assert.equal(developmentRemote?.sourceLabel, 'remote tip, detached');
  assert.equal(developmentRemote?.createLocalBranch, false);
  assert.equal(developmentRemote?.attachedBranchName, undefined);

  const remoteOnly = candidates.find(candidate =>
    candidate.branchName === 'remote-only' &&
    candidate.checkoutRef === 'origin/remote-only'
  );
  assert.equal(remoteOnly?.sourceLabel, 'remote, creates local branch');
  assert.equal(remoteOnly?.createLocalBranch, true);
  assert.equal(remoteOnly?.attachedBranchName, 'remote-only');

  const localOnlyRemote = candidates.find(candidate =>
    candidate.branchName === 'local-only' &&
    candidate.checkoutRef === 'origin/local-only'
  );
  assert.equal(localOnlyRemote, undefined);

  const existingBranchWorktree = findExistingBranchWorktree(
    [
      { path: repo, HEAD: 'main-head', branch: 'main' },
      { path: path.join(tmp, 'external-development'), HEAD: 'development-head', branch: 'development' },
    ],
    'development'
  );
  assert.equal(existingBranchWorktree?.path, path.join(tmp, 'external-development'));

  console.log('worktree checkout branch candidate tests passed');
} finally {
  await rm(tmp, { recursive: true, force: true });
}
