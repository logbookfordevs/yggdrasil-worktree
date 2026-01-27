import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { log, createSpinner } from './ui.js';

export interface AnvilConfig {
    'setup-worktree'?: string[];
}

export async function getBootstrapCommands(repoRoot: string): Promise<string[] | null> {
    const configPath = path.join(repoRoot, 'anvil-worktree.json');
    const cursorConfigPath = path.join(repoRoot, '.cursor', 'worktrees.json');

    if (await fs.pathExists(configPath)) {
        try {
            const config: AnvilConfig = await fs.readJSON(configPath);
            if (config['setup-worktree'] && Array.isArray(config['setup-worktree'])) {
                return config['setup-worktree'];
            }
        } catch (e) {
            log.warning(`Failed to parse ${configPath}.`);
        }
    }

    if (await fs.pathExists(cursorConfigPath)) {
        try {
            const config: AnvilConfig = await fs.readJSON(cursorConfigPath);
            if (config['setup-worktree'] && Array.isArray(config['setup-worktree'])) {
                return config['setup-worktree'];
            }
        } catch (e) {
            log.warning(`Failed to parse ${cursorConfigPath}.`);
        }
    }

    return null;
}

export async function runBootstrap(wtPath: string, repoRoot: string) {
    const customCommands = await getBootstrapCommands(repoRoot);

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
                log.error(e.message);
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
                log.error(e.message);
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
            log.error(e.message);
            log.warning('Tip: If auth failed, try adding your key to the agent.');
        }
    }
}
