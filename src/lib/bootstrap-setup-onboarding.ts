import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getBootstrapCommands, writeBootstrapCommands } from './config.js';
import { promptBootstrapCommands } from './bootstrap-config-prompt.js';
import { hasRegisteredRepoPath, registerRepo, Registry } from './registry.js';
import { log } from './ui.js';

interface BootstrapSetupOnboardingOptions {
    interactive: boolean;
    registeredReposBefore: Registry;
    repoRoot: string;
}

interface BootstrapSetupOnboardingResult {
    created: boolean;
    skipBootstrap: boolean;
}

export async function maybeOfferBootstrapSetupConfig(
    options: BootstrapSetupOnboardingOptions
): Promise<BootstrapSetupOnboardingResult> {
    if (!options.interactive || !process.stdin.isTTY) {
        return { created: false, skipBootstrap: false };
    }

    if (await hasRegisteredRepoPath(options.repoRoot, options.registeredReposBefore)) {
        return { created: false, skipBootstrap: false };
    }

    if (await getBootstrapCommands(options.repoRoot)) {
        return { created: false, skipBootstrap: false };
    }

    const { shouldCreateSetupConfig } = await inquirer.prompt<{ shouldCreateSetupConfig: boolean }>([
        {
            type: 'confirm',
            name: 'shouldCreateSetupConfig',
            message: 'Create .yggtree/worktree-setup.json for this repo?',
            default: false,
        },
    ]);

    if (!shouldCreateSetupConfig) {
        await registerRepo(path.basename(options.repoRoot), options.repoRoot);
        return { created: false, skipBootstrap: true };
    }

    const commands = await promptBootstrapCommands();
    const configPath = await writeBootstrapCommands(options.repoRoot, commands);
    log.success('Created local bootstrap config.');
    log.dim(`Saved to ${chalk.cyan(configPath)}.`);

    return { created: true, skipBootstrap: false };
}
