import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { log, createSpinner } from './ui.js';

export interface YggtreeConfig {
    'setup-worktree'?: string[];
}

export async function getBootstrapCommands(repoRoot: string, wtPath?: string): Promise<string[] | null> {
    // repoRoot first (source of truth — where yggtree is run from)
    // wtPath second (per-worktree override if needed)
    const searchPaths = [repoRoot];
    if (wtPath && wtPath !== repoRoot) searchPaths.push(wtPath);

    for (const searchPath of searchPaths) {
        const yggtreeConfigPath = path.join(searchPath, '.yggtree', 'worktree-setup.json');
        const configPath = path.join(searchPath, 'yggtree-worktree.json');
        const cursorConfigPath = path.join(searchPath, '.cursor', 'worktrees.json');

        if (await fs.pathExists(yggtreeConfigPath)) {
            try {
                const config: YggtreeConfig = await fs.readJSON(yggtreeConfigPath);
                if (config['setup-worktree'] && Array.isArray(config['setup-worktree'])) {
                    return config['setup-worktree'];
                }
            } catch (e) {
                log.warning(`Failed to parse ${yggtreeConfigPath}.`);
            }
        }

        if (await fs.pathExists(configPath)) {
            try {
                const config: YggtreeConfig = await fs.readJSON(configPath);
                if (config['setup-worktree'] && Array.isArray(config['setup-worktree'])) {
                    return config['setup-worktree'];
                }
            } catch (e) {
                log.warning(`Failed to parse ${configPath}.`);
            }
        }

        if (await fs.pathExists(cursorConfigPath)) {
            try {
                const config: YggtreeConfig = await fs.readJSON(cursorConfigPath);
                if (config['setup-worktree'] && Array.isArray(config['setup-worktree'])) {
                    return config['setup-worktree'];
                }
            } catch (e) {
                log.warning(`Failed to parse ${cursorConfigPath}.`);
            }
        }
    }

    return null;
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
    } else {
        // Fallback to default behavior
        log.info('Running default bootstrap (npm install + submodules)...');
        
        // npm install
        try {
            await execa('npm', ['--version']);
            const installSpinner = createSpinner('Running npm install...').start();
            try {
                await execa('npm', ['install'], { cwd: wtPath });
                installSpinner.succeed('Dependencies installed.');
            } catch (e: any) {
                installSpinner.fail('npm install failed.');
                log.actionableError(e.message, 'npm install', wtPath, [
                    `cd ${wtPath} && npm install`,
                    'Check your network connection and package-lock.json'
                ]);
            }
        } catch {
            log.warning('npm not found, skipping install.');
        }

        // Submodules
        const subSpinner = createSpinner('Syncing submodules...').start();
        try {
            await execa('git', ['submodule', 'sync', '--recursive'], { cwd: wtPath });
            await execa('git', ['submodule', 'update', '--init', '--recursive'], { cwd: wtPath });
            subSpinner.succeed('Submodules synced.');
        } catch (e: any) {
            subSpinner.fail('Submodule sync failed.');
            const isAuthError = /permission denied|authentication|publickey/i.test(e.message);
            const steps = [
                'git submodule sync --recursive',
                'git submodule update --init --recursive'
            ];
            if (isAuthError) {
                steps.unshift(
                    'ssh -T git@github.com',
                    'ssh-add --apple-use-keychain ~/.ssh/id_ed25519'
                );
            }
            log.actionableError(e.message, 'git submodule update --init --recursive', wtPath, steps);
        }
    }
}
