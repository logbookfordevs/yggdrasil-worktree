import chalk from 'chalk';
import inquirer from 'inquirer';
import { getRepoRoot } from './git.js';
import { getManagedWorktreesRoot } from './global-config.js';
import { getValidRegisteredRepos } from './registry.js';
import { log } from './ui.js';
import { formatWorktreeDisplayPath } from './worktree.js';

export async function ensureRepoContext(): Promise<string> {
    try {
        return await getRepoRoot();
    } catch {
        const validRepos = await getValidRegisteredRepos();
        const repoEntries = Object.entries(validRepos);
        const managedRoot = await getManagedWorktreesRoot();

        if (repoEntries.length === 0) {
            log.error('Not inside a git repository and no registered realms found.');
            log.dim('Run `yggtree` inside an existing git project first to register it.');
            process.exit(1);
        }

        if (repoEntries.length === 1 && (process.env.CI === 'true' || !process.stdin.isTTY)) {
            const [, selectedRepoPath] = repoEntries[0];
            process.chdir(selectedRepoPath);
            return await getRepoRoot();
        }

        if (!process.stdin.isTTY) {
            log.error('Not inside a git repository and multiple registered realms are available.');
            log.dim('Run yggtree from the repo you want to use, or run interactive mode from a real terminal to choose one.');
            log.dim(`Available realms: ${repoEntries.map(([name]) => name).join(', ')}`);
            process.exit(1);
        }

        console.log(chalk.bold('\n  Not inside a realm. Pick a known one:'));
        const { selectedRepoPath } = await inquirer.prompt<{ selectedRepoPath: string }>([
            {
                type: 'list',
                name: 'selectedRepoPath',
                message: 'Select a realm:',
                choices: repoEntries.map(([name, repoPath]) => ({
                    name: `${chalk.bold.yellow(name)} ${chalk.dim(formatWorktreeDisplayPath(repoPath, managedRoot))}`,
                    value: repoPath,
                })),
                pageSize: 10,
            },
        ]);

        process.chdir(selectedRepoPath);
        return await getRepoRoot();
    }
}
