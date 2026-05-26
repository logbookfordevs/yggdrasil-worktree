import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { log } from './ui.js';

const EXAMPLE_ENV_FILES = new Set([
    '.env.example',
    '.env.sample',
    '.env.template',
    '.env.defaults',
]);

export async function findLocalEnvFiles(repoRoot: string): Promise<string[]> {
    const entries = await fs.readdir(repoRoot, { withFileTypes: true });

    return entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name)
        .filter(name => name === '.env' || name.startsWith('.env.'))
        .filter(name => !EXAMPLE_ENV_FILES.has(name))
        .sort((a, b) => a.localeCompare(b));
}

export async function copyEnvFiles(repoRoot: string, wtPath: string, envFiles: string[]): Promise<void> {
    if (envFiles.length === 0) return;

    for (const envFile of envFiles) {
        await fs.copy(path.join(repoRoot, envFile), path.join(wtPath, envFile));
    }

    log.info(`Copied ${envFiles.map(file => chalk.cyan(file)).join(', ')} to the worktree.`);
}

export async function promptAndCopyEnvFiles(repoRoot: string, wtPath: string, envFiles?: string[]): Promise<void> {
    const files = envFiles || await findLocalEnvFiles(repoRoot);
    if (files.length === 0) return;

    const { shouldCopyEnvFiles } = await inquirer.prompt<{ shouldCopyEnvFiles: boolean }>([
        {
            type: 'confirm',
            name: 'shouldCopyEnvFiles',
            message: `Copy local env file${files.length === 1 ? '' : 's'} to this worktree? (${files.join(', ')})`,
            default: false,
        },
    ]);

    if (!shouldCopyEnvFiles) {
        log.dim('Skipped local env files.');
        return;
    }

    await copyEnvFiles(repoRoot, wtPath, files);
}
