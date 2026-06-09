import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { YGG_ROOT } from './paths.js';

export type WorktreeLayout = 'yggtree' | 'codex';

export interface GlobalConfig {
    worktreesRoot?: string;
    worktreeLayout?: WorktreeLayout;
}

export interface WorktreePathConfig {
    root: string;
    layout: WorktreeLayout;
}

const CONFIG_PATH = path.join(YGG_ROOT, 'config.json');
const DEFAULT_WORKTREE_LAYOUT: WorktreeLayout = 'yggtree';

export function expandHome(value: string): string {
    if (value === '~') return os.homedir();
    if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
    return value;
}

export function formatHome(value: string): string {
    const home = os.homedir();
    if (value === home) return '~';
    if (value.startsWith(`${home}${path.sep}`)) return `~/${path.relative(home, value)}`;
    return value;
}

function normalizeRoot(value?: string): string {
    return path.resolve(expandHome(value || YGG_ROOT));
}

function normalizeLayout(value?: WorktreeLayout): WorktreeLayout {
    return value || DEFAULT_WORKTREE_LAYOUT;
}

export async function readGlobalConfig(): Promise<GlobalConfig> {
    try {
        if (await fs.pathExists(CONFIG_PATH)) {
            const config = await fs.readJSON(CONFIG_PATH) as GlobalConfig;
            return {
                worktreesRoot: typeof config.worktreesRoot === 'string' ? config.worktreesRoot : undefined,
                worktreeLayout: config.worktreeLayout === 'codex' ? 'codex' : undefined,
            };
        }
    } catch {
        return {};
    }

    return {};
}

export async function writeGlobalConfig(config: GlobalConfig): Promise<void> {
    await fs.ensureDir(YGG_ROOT);
    await fs.writeJSON(CONFIG_PATH, config, { spaces: 2 });
}

export async function getWorktreePathConfig(): Promise<WorktreePathConfig> {
    const config = await readGlobalConfig();
    return {
        root: normalizeRoot(config.worktreesRoot),
        layout: normalizeLayout(config.worktreeLayout),
    };
}

export async function getManagedWorktreesRoot(): Promise<string> {
    const config = await getWorktreePathConfig();
    return config.root;
}

export function buildManagedWorktreePath(repoName: string, worktreeSlug: string, config: WorktreePathConfig): string {
    if (config.layout === 'codex') {
        return path.join(config.root, worktreeSlug, repoName);
    }

    return path.join(config.root, repoName, worktreeSlug);
}

export function getPresetConfig(preset: string): GlobalConfig | undefined {
    const normalized = preset.trim().toLowerCase();
    if (normalized === 'default' || normalized === 'yggtree') {
        return {};
    }

    if (normalized === 'codex') {
        return {
            worktreesRoot: '~/.codex/worktrees',
            worktreeLayout: 'codex',
        };
    }

    return undefined;
}

export function formatGlobalConfig(config: GlobalConfig, resolved: WorktreePathConfig): string[] {
    return [
        `worktreesRoot: ${formatHome(resolved.root)}`,
        `worktreeLayout: ${resolved.layout}`,
        `configFile: ${formatHome(CONFIG_PATH)}`,
        config.worktreesRoot || config.worktreeLayout
            ? 'preset: custom'
            : 'preset: default',
    ];
}
