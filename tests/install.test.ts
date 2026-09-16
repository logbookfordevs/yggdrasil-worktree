import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function runInstaller(releaseUrl: string, version = 'latest', lookupStatus = '0') {
    const root = mkdtempSync(join(tmpdir(), 'yggtree-install-test-'));
    const calls = join(root, 'calls');
    writeFileSync(join(root, 'curl'), `#!/bin/bash
printf '%s\\n' "$*" >> "$TEST_CALLS"
case "$*" in
  *api.github.com*) exit 22 ;;
  *releases/latest*) printf '%s' "$TEST_RELEASE_URL"; exit "$TEST_LOOKUP_STATUS" ;;
  *) exit 77 ;;
esac
`, { mode: 0o755 });

    try {
        const result = spawnSync('bash', [resolve('scripts/install.sh')], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: `${root}:${process.env.PATH}`,
                TEST_CALLS: calls,
                TEST_RELEASE_URL: releaseUrl,
                TEST_LOOKUP_STATUS: lookupStatus,
                YGGTREE_INSTALL_REPO: 'example/project',
                YGGTREE_INSTALL_VERSION: version,
                YGGTREE_INSTALL_ROOT: join(root, 'install'),
                YGGTREE_BIN_DIR: join(root, 'bin'),
            },
        });
        return { ...result, calls: readFileSync(calls, 'utf8') };
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

describe('release installer', () => {
    it('downloads the redirected release without using the rate-limited API', () => {
        const result = runInstaller('https://github.com/example/project/releases/tag/v2.3.4');
        expect(result.calls).not.toContain('api.github.com');
        expect(result.calls).toContain('https://github.com/example/project/releases/download/v2.3.4/yggtree-cli.tar.gz');
        expect(result.status).toBe(77);
    });

    it.each([
        ['https://github.com/example/project/releases/latest', '0'],
        ['https://github.com/example/project/releases/tag/', '0'],
        ['https://github.com/other/project/releases/tag/v2.3.4', '0'],
        ['', '22'],
    ])('stops clearly when release lookup is invalid or fails: %s %s', (url, status) => {
        const result = runInstaller(url, 'latest', status);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('could not resolve latest release for example/project');
        expect(result.calls).not.toContain('/releases/download/');
    });

    it('keeps explicit versions independent of latest-release lookup', () => {
        const result = runInstaller('', '2.3.4');
        expect(result.calls).not.toContain('/releases/latest');
        expect(result.calls).toContain('/releases/download/v2.3.4/yggtree-cli.tar.gz');
        expect(result.status).toBe(77);
    });

    it('ships the same valid installer on the website', () => {
        expect(readFileSync('apps/site/public/install.sh', 'utf8')).toBe(readFileSync('scripts/install.sh', 'utf8'));
        execFileSync('bash', ['-n', 'scripts/install.sh']);
    });
});
