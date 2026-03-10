import fs from 'fs-extra';
import path from 'path';
import { YGG_ROOT } from './paths.js';

export interface Registry {
    /** Map of repoName -> repoRootPath */
    repos: Record<string, string>;
}

const REGISTRY_PATH = path.join(YGG_ROOT, 'registry.json');

/**
 * Read the registry, initializing if missing.
 */
export async function readRegistry(): Promise<Registry> {
    try {
        if (await fs.pathExists(REGISTRY_PATH)) {
            return await fs.readJson(REGISTRY_PATH);
        }
    } catch {
        // Ignore JSON read errors, just return empty
    }
    return { repos: {} };
}

/**
 * Write the registry back to disk.
 */
async function writeRegistry(registry: Registry): Promise<void> {
    await fs.ensureDir(YGG_ROOT);
    await fs.writeJson(REGISTRY_PATH, registry, { spaces: 2 });
}

/**
 * Silently register a repository path.
 * This is meant to be called in the background (fire-and-forget).
 */
export async function registerRepo(repoName: string, repoRoot: string): Promise<void> {
    try {
        const registry = await readRegistry();
        
        // Only write if it actually changed
        if (registry.repos[repoName] !== repoRoot) {
            registry.repos[repoName] = repoRoot;
            await writeRegistry(registry);
        }
    } catch {
        // Fail silently — registry is a nice-to-have, shouldn't crash commands
    }
}

/**
 * Get a specific repo path from the registry.
 * Also verifies the path still exists on disk, removing it if not.
 */
export async function getRegisteredRepoPath(repoName: string): Promise<string | null> {
    const registry = await readRegistry();
    const repoPath = registry.repos[repoName];

    if (!repoPath) return null;

    // Prune dead links
    if (!(await fs.pathExists(repoPath))) {
        delete registry.repos[repoName];
        await writeRegistry(registry).catch(() => {});
        return null;
    }

    return repoPath;
}

/**
 * Get all registered repos that still exist on disk.
 */
export async function getValidRegisteredRepos(): Promise<Record<string, string>> {
    const registry = await readRegistry();
    const valid: Record<string, string> = {};
    let changed = false;

    // Validate in parallel
    await Promise.all(
        Object.entries(registry.repos).map(async ([name, rPath]) => {
            if (await fs.pathExists(rPath)) {
                valid[name] = rPath;
            } else {
                delete registry.repos[name];
                changed = true;
            }
        })
    );

    if (changed) {
        await writeRegistry(registry).catch(() => {});
    }

    return valid;
}
