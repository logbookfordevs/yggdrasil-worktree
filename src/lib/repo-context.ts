import chalk from 'chalk';
import inquirer from 'inquirer';
import { getRepoRoot } from './git.js';
import { getValidRegisteredRepos } from './registry.js';
import { log } from './ui.js';
import { formatWorktreeDisplayPath } from './worktree.js';

export async function ensureRepoContext(): Promise<string> {
    try {
        return await getRepoRoot();
    } catch {
        const validRepos = await getValidRegisteredRepos();
        const repoEntries = Object.entries(validRepos);

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

        console.log(chalk.bold('\n  Not inside a realm. Pick a known one:'));
        const { selectedRepoPath } = await inquirer.prompt<{ selectedRepoPath: string }>([
            {
                type: 'list',
                name: 'selectedRepoPath',
                message: 'Select a realm:',
                choices: repoEntries.map(([name, repoPath]) => ({
                    name: `${chalk.bold.yellow(name)} ${chalk.dim(formatWorktreeDisplayPath(repoPath))}`,
                    value: repoPath,
                })),
                pageSize: 10,
            },
        ]);

        process.chdir(selectedRepoPath);
        return await getRepoRoot();
    }
}
