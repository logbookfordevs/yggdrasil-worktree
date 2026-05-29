import { describe, expect, it } from 'vitest';
import { checkForUpdate, isNewerVersion } from '../src/lib/update-check.js';
import { getVersion } from '../src/lib/version.js';

describe('update check', () => {
    it('detects when the npm package version is newer', () => {
        expect(isNewerVersion('1.4.3', '1.4.2')).toBe(true);
        expect(isNewerVersion('1.5.0', '1.4.9')).toBe(true);
        expect(isNewerVersion('2.0.0', '1.99.99')).toBe(true);
    });

    it('does not report updates for equal or older versions', () => {
        expect(isNewerVersion('1.4.2', '1.4.2')).toBe(false);
        expect(isNewerVersion('1.4.1', '1.4.2')).toBe(false);
        expect(isNewerVersion('1.4', '1.4.0')).toBe(false);
    });

    it('returns update metadata without touching the network when a fetcher is provided', async () => {
        const result = await checkForUpdate({
            fetchLatestVersion: async () => '9.9.9',
        });

        expect(result).toEqual({
            currentVersion: getVersion(),
            latestVersion: '9.9.9',
            updateAvailable: true,
        });
    });

    it('stays quiet when the latest version cannot be fetched', async () => {
        const result = await checkForUpdate({
            fetchLatestVersion: async () => {
                throw new Error('offline');
            },
        });

        expect(result).toBeNull();
    });
});
