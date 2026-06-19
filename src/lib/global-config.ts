import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { YGG_ROOT } from './paths.js';

export type WorktreeLayout = 'yggtree' | 'codex' | 'claude';

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

function normalizeRoot(value: string | undefined, layout: WorktreeLayout, repoRoot?: string): string {
    if (value) return path.resolve(expandHome(value));
    if (layout === 'claude') {
        return path.join(path.resolve(repoRoot || process.cwd()), '.claude', 'worktrees');
    }
    return path.resolve(YGG_ROOT);
}

export function normalizeWorktreesRootInput(value: string): string {
    return path.resolve(expandHome(value));
}

function normalizeLayout(value?: WorktreeLayout): WorktreeLayout {
    return value || DEFAULT_WORKTREE_LAYOUT;
}

function isWorktreeLayout(value: unknown): value is WorktreeLayout {
    return value === 'yggtree' || value === 'codex' || value === 'claude';
}

export async function readGlobalConfig(): Promise<GlobalConfig> {
    try {
        if (await fs.pathExists(CONFIG_PATH)) {
            const config = await fs.readJSON(CONFIG_PATH) as GlobalConfig;
            return {
                worktreesRoot: typeof config.worktreesRoot === 'string' ? config.worktreesRoot : undefined,
                worktreeLayout: isWorktreeLayout(config.worktreeLayout) ? config.worktreeLayout : undefined,
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

export async function getWorktreePathConfig(repoRoot?: string): Promise<WorktreePathConfig> {
    const config = await readGlobalConfig();
    const layout = normalizeLayout(config.worktreeLayout);
    return {
        root: normalizeRoot(config.worktreesRoot, layout, repoRoot),
        layout,
    };
}

export async function getManagedWorktreesRoot(repoRoot?: string): Promise<string> {
    const config = await getWorktreePathConfig(repoRoot);
    return config.root;
}

export function buildManagedWorktreePath(repoName: string, worktreeSlug: string, config: WorktreePathConfig): string {
    if (config.layout === 'codex') {
        return path.join(config.root, worktreeSlug, repoName);
    }

    if (config.layout === 'claude') {
        return path.join(config.root, worktreeSlug);
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

    if (normalized === 'claude') {
        return {
            worktreeLayout: 'claude',
        };
    }

    return undefined;
}

function inferPreset(config: GlobalConfig): string {
    if (!config.worktreesRoot && !config.worktreeLayout) return 'default';
    if (!config.worktreesRoot && config.worktreeLayout === 'claude') return 'claude';
    if (config.worktreesRoot === '~/.codex/worktrees' && config.worktreeLayout === 'codex') return 'codex';
    return 'custom';
}

export function formatGlobalConfig(config: GlobalConfig, resolved: WorktreePathConfig): string[] {
    return [
        `worktreesRoot: ${formatHome(resolved.root)}`,
        `worktreeLayout: ${resolved.layout}`,
        `configFile: ${formatHome(CONFIG_PATH)}`,
        `preset: ${inferPreset(config)}`,
    ];
}
