import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  copyEnvFiles,
  findLocalEnvFiles,
  promptAndCopyEnvFiles,
  promptAndCopyEnvFilesToWorktrees,
} from '../dist/lib/env-files.js';

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'yggtree-env-files-'));

async function writeFile(filePath, contents = '') {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents);
}

try {
  const repoRoot = path.join(tmpRoot, 'repo');
  const worktreeRoot = path.join(tmpRoot, 'worktree');
  const otherWorktreeRoot = path.join(tmpRoot, 'other-worktree');

  await fs.mkdir(repoRoot, { recursive: true });
  await fs.mkdir(worktreeRoot, { recursive: true });
  await fs.mkdir(otherWorktreeRoot, { recursive: true });
  await writeFile(path.join(repoRoot, '.env'), 'SECRET=one\n');
  await writeFile(path.join(repoRoot, '.env.local'), 'LOCAL=true\n');
  await writeFile(path.join(repoRoot, '.env.example'), 'EXAMPLE=true\n');
  await writeFile(path.join(repoRoot, 'README.md'), '# test\n');

  assert.deepEqual(await findLocalEnvFiles(repoRoot), ['.env', '.env.local']);

  await copyEnvFiles(repoRoot, worktreeRoot, ['.env']);
  assert.equal(await fs.readFile(path.join(worktreeRoot, '.env'), 'utf8'), 'SECRET=one\n');

  const previousCi = process.env.CI;
  process.env.CI = 'true';

  await promptAndCopyEnvFiles(repoRoot, otherWorktreeRoot, ['.env']);
  await assert.rejects(
    fs.access(path.join(otherWorktreeRoot, '.env')),
    { code: 'ENOENT' },
  );

  const multiA = path.join(tmpRoot, 'multi-a');
  const multiB = path.join(tmpRoot, 'multi-b');
  await fs.mkdir(multiA, { recursive: true });
  await fs.mkdir(multiB, { recursive: true });
  await promptAndCopyEnvFilesToWorktrees(repoRoot, [multiA, multiB], ['.env']);
  await assert.rejects(fs.access(path.join(multiA, '.env')), { code: 'ENOENT' });
  await assert.rejects(fs.access(path.join(multiB, '.env')), { code: 'ENOENT' });

  if (previousCi === undefined) {
    delete process.env.CI;
  } else {
    process.env.CI = previousCi;
  }

  console.log('env file helper tests passed');
} finally {
  await fs.rm(tmpRoot, { recursive: true, force: true });
}
