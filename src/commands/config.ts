import chalk from 'chalk';
import {
    formatGlobalConfig,
    getPresetConfig,
    getWorktreePathConfig,
    readGlobalConfig,
    writeGlobalConfig,
    WorktreeLayout,
} from '../lib/global-config.js';
import { log } from '../lib/ui.js';

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
        log.dim('Available presets: default, yggtree, codex');
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
        worktreesRoot: root,
        worktreeLayout: currentConfig.worktreeLayout || 'yggtree',
    });
    log.success('Updated worktrees root.');
    await configGetCommand();
}

export async function configSetWorktreeLayoutCommand(layout: WorktreeLayout) {
    if (layout !== 'yggtree' && layout !== 'codex') {
        log.error(`Unknown worktree layout "${layout}".`);
        log.dim('Available layouts: yggtree, codex');
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

export async function configResetCommand() {
    await writeGlobalConfig({});
    log.success('Reset Yggtree config to defaults.');
    await configGetCommand();
}
