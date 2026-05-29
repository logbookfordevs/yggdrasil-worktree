import chalk from 'chalk';
import { execa } from 'execa';
import { getVersion } from './version.js';
import { log } from './ui.js';

export interface UpdateCheckResult {
    currentVersion: string;
    latestVersion: string;
    updateAvailable: boolean;
}

interface UpdateCheckOptions {
    fetchLatestVersion?: () => Promise<string>;
}

function parseVersion(version: string): number[] {
    const [core] = version.trim().replace(/^v/, '').split('-');
    return core.split('.').map(part => {
        const parsed = Number.parseInt(part, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    });
}

export function isNewerVersion(latestVersion: string, currentVersion: string): boolean {
    const latestParts = parseVersion(latestVersion);
    const currentParts = parseVersion(currentVersion);
    const maxLength = Math.max(latestParts.length, currentParts.length);

    for (let index = 0; index < maxLength; index += 1) {
        const latestPart = latestParts[index] ?? 0;
        const currentPart = currentParts[index] ?? 0;

        if (latestPart > currentPart) return true;
        if (latestPart < currentPart) return false;
    }

    return false;
}

export async function fetchLatestPackageVersion(): Promise<string> {
    const { stdout } = await execa('npm', ['view', 'yggtree', 'version', '--silent'], {
        timeout: 3_000,
    });

    return stdout.trim();
}

export async function checkForUpdate(options: UpdateCheckOptions = {}): Promise<UpdateCheckResult | null> {
    const currentVersion = getVersion();
    const fetchLatestVersion = options.fetchLatestVersion ?? fetchLatestPackageVersion;

    try {
        const latestVersion = await fetchLatestVersion();
        if (!latestVersion) return null;

        return {
            currentVersion,
            latestVersion,
            updateAvailable: isNewerVersion(latestVersion, currentVersion),
        };
    } catch {
        return null;
    }
}

export async function notifyIfUpdateAvailable(): Promise<void> {
    const result = await checkForUpdate();

    if (!result?.updateAvailable) return;

    log.warning(`A newer yggtree is available: ${chalk.dim(`v${result.currentVersion}`)} -> ${chalk.green(`v${result.latestVersion}`)}`);
    log.dim('Update with: npm install -g yggtree');
}
