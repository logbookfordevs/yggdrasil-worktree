import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { log, createSpinner } from './ui.js';

export interface YggtreeConfig {
    'setup-worktree'?: string[];
}

export function getWorktreeSetupConfigPath(root: string): string {
    return path.join(root, '.yggtree', 'worktree-setup.json');
}

async function readBootstrapCommands(configPath: string): Promise<string[] | null> {
    try {
        const config: YggtreeConfig = await fs.readJSON(configPath);
        if (config['setup-worktree'] && Array.isArray(config['setup-worktree'])) {
            return config['setup-worktree'];
        }
    } catch {
        log.warning(`Failed to parse ${configPath}.`);
    }

    return null;
}

export async function getBootstrapCommands(
    repoRoot: string,
    wtPath?: string
): Promise<string[] | null> {
    // repoRoot first (source of truth — where yggtree is run from)
    // wtPath second (per-worktree override if needed)
    const searchPaths = [repoRoot];
    if (wtPath && wtPath !== repoRoot) searchPaths.push(wtPath);

    for (const searchPath of searchPaths) {
        const yggtreeConfigPath = getWorktreeSetupConfigPath(searchPath);
        const configPath = path.join(searchPath, 'yggtree-worktree.json');
        const cursorConfigPath = path.join(searchPath, '.cursor', 'worktrees.json');

        if (await fs.pathExists(yggtreeConfigPath)) {
            const commands = await readBootstrapCommands(yggtreeConfigPath);
            if (commands) return commands;
        }

        if (await fs.pathExists(configPath)) {
            const commands = await readBootstrapCommands(configPath);
            if (commands) return commands;
        }

        if (await fs.pathExists(cursorConfigPath)) {
            const commands = await readBootstrapCommands(cursorConfigPath);
            if (commands) return commands;
        }
    }

    return null;
}

export async function writeBootstrapCommands(root: string, commands: string[]): Promise<string> {
    const configPath = getWorktreeSetupConfigPath(root);
    await fs.ensureDir(path.dirname(configPath));
    await fs.writeJSON(
        configPath,
        { 'setup-worktree': commands },
        { spaces: 2 }
    );
    return configPath;
}

export async function clearBootstrapCommands(root: string): Promise<string> {
    const configPath = getWorktreeSetupConfigPath(root);
    await fs.remove(configPath);
    return configPath;
}

export async function runBootstrap(wtPath: string, repoRoot: string) {
    const customCommands = await getBootstrapCommands(repoRoot, wtPath);

    if (customCommands) {
        log.info('Using custom bootstrap commands from config...');
        for (const cmd of customCommands) {
            const spinner = createSpinner(`Running: ${cmd}`).start();
            try {
                // Split command and arguments properly if needed, or run via shell
                await execa(cmd, { cwd: wtPath, shell: true });
                spinner.succeed(`Finished: ${cmd}`);
            } catch (e: any) {
                spinner.fail(`Failed: ${cmd}`);
                log.actionableError(e.message, cmd, wtPath, [
                    `Try running the command manually: cd ${wtPath} && ${cmd}`,
                    'Check your configuration in .yggtree/worktree-setup.json or yggtree-worktree.json'
                ]);
            }
        }
        return;
    }

    log.info('No bootstrap commands configured. Skipping setup.');
    log.dim('Tip: run yggtree config bootstrap --command "pnpm install" to create .yggtree/worktree-setup.json.');
}
