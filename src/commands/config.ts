import chalk from 'chalk';
import {
    clearBootstrapCommands,
    writeBootstrapCommands,
} from '../lib/config.js';
import { promptBootstrapCommands } from '../lib/bootstrap-config-prompt.js';
import {
    formatGlobalConfig,
    getPresetConfig,
    getWorktreePathConfig,
    normalizeWorktreesRootInput,
    readGlobalConfig,
    writeGlobalConfig,
    WorktreeLayout,
} from '../lib/global-config.js';
import { log } from '../lib/ui.js';

interface ConfigBootstrapOptions {
    command?: string[];
    clear?: boolean;
}

export async function configGetCommand() {
    const [rawConfig, resolvedConfig] = await Promise.all([
        readGlobalConfig(),
        getWorktreePathConfig(),
    ]);

    console.log(chalk.bold('\n  Yggtree config\n'));
    formatGlobalConfig(rawConfig, resolvedConfig)
        .forEach(line => console.log(`  ${line}`));
    console.log('');
}

export async function configUseCommand(preset: string) {
    const presetConfig = getPresetConfig(preset);
    if (!presetConfig) {
        log.error(`Unknown config preset "${preset}".`);
        log.dim('Available presets: default, yggtree, codex, claude');
        return;
    }

    await writeGlobalConfig(presetConfig);
    log.success(`Using ${preset} worktree layout.`);
    await configGetCommand();
}

export async function configSetWorktreesRootCommand(root: string) {
    const currentConfig = await readGlobalConfig();
    await writeGlobalConfig({
        ...currentConfig,
        worktreesRoot: normalizeWorktreesRootInput(root),
        worktreeLayout: currentConfig.worktreeLayout || 'yggtree',
    });
    log.success('Updated worktrees root.');
    await configGetCommand();
}

export async function configSetWorktreeLayoutCommand(layout: WorktreeLayout) {
    if (layout !== 'yggtree' && layout !== 'codex' && layout !== 'claude') {
        log.error(`Unknown worktree layout "${layout}".`);
        log.dim('Available layouts: yggtree, codex, claude');
        return;
    }

    const currentConfig = await readGlobalConfig();
    await writeGlobalConfig({
        ...currentConfig,
        worktreeLayout: layout,
    });
    log.success('Updated worktree layout.');
    await configGetCommand();
}

export async function configBootstrapCommand(options: ConfigBootstrapOptions) {
    const targetRoot = process.cwd();

    if (options.clear) {
        const configPath = await clearBootstrapCommands(targetRoot);
        log.success('Cleared local bootstrap commands.');
        log.dim(`Removed ${chalk.cyan(configPath)} if it existed.`);
        return;
    }

    const commandOptions = options.command?.map(command => command.trim()).filter(Boolean) ?? [];
    const commands = commandOptions.length > 0
        ? commandOptions
        : await promptBootstrapCommands();

    if (commands.length === 0) {
        log.info('No bootstrap commands provided.');
        return;
    }

    const configPath = await writeBootstrapCommands(targetRoot, commands);
    log.success('Updated local bootstrap commands.');
    log.dim(`Saved to ${chalk.cyan(configPath)}.`);
}

export async function configResetCommand() {
    await writeGlobalConfig({});
    log.success('Reset Yggtree config to defaults.');
    await configGetCommand();
}
