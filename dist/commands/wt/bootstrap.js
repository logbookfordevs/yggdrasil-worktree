import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { listWorktrees, syncSubmodules, getRepoRoot } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, createSpinner } from '../../lib/ui.js';
import { execa } from 'execa';
export async function bootstrapCommand() {
    try {
        const _ = await getRepoRoot();
        const worktrees = await listWorktrees();
        // 1. Select Worktree
        // Filter managed or just show all? The prompt said "managed", let's prioritize managed but maybe allow all if needed?
        // User requirements say "managed", sticking to that for consistency.
        const managedWts = worktrees.filter(wt => wt.path.startsWith(WORKTREES_ROOT));
        if (managedWts.length === 0) {
            log.info('No managed worktrees found to bootstrap.');
            return;
        }
        const choices = managedWts.map(wt => ({
            name: `${chalk.bold(path.basename(wt.path))} (${chalk.dim(wt.branch || wt.HEAD)})`,
            value: wt.path,
        }));
        const { selectedPath } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedPath',
                message: 'Select worktree to bootstrap:',
                choices: choices,
            },
        ]);
        const wtPath = selectedPath;
        log.info(`Bootstrapping ${chalk.bold(path.basename(wtPath))}...`);
        // 2. npm install
        try {
            await execa('npm', ['--version']);
            const installSpinner = createSpinner('Running npm install...').start();
            try {
                await execa('npm', ['install'], { cwd: wtPath });
                installSpinner.succeed('Dependencies installed.');
            }
            catch (e) {
                installSpinner.fail('npm install failed.');
                log.error(e.message);
            }
        }
        catch {
            log.warning('npm not found, skipping install.');
        }
        // 3. Submodules
        const subSpinner = createSpinner('Syncing submodules...').start();
        try {
            await syncSubmodules(wtPath);
            subSpinner.succeed('Submodules synced.');
        }
        catch (e) {
            subSpinner.fail('Submodule sync failed.');
            log.error(e.message);
            log.warning('Tip: If auth failed, try adding your key to the agent.');
        }
        log.success('Bootstrap completed!');
    }
    catch (error) {
        log.error(error.message);
        process.exit(1);
    }
}
