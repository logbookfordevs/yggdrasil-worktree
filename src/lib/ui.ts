import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import ora, { Ora } from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import { getVersion } from './version.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Personality & Branding ---

export const welcome = async () => {
    console.log('');
    const title = figlet.textSync('Yggdrasil', { font: 'Standard' });
    console.log(gradient.mind.multiline(title));
    const version = getVersion();
    console.log(chalk.dim(`  v${version} • The World Tree Worktree Assistant`));
    console.log('');
};

// --- Logger ---

export const log = {
    info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
    success: (msg: string) => console.log(chalk.green('✔'), msg),
    warning: (msg: string) => console.log(chalk.yellow('⚠'), msg),
    error: (msg: string) => console.log(chalk.red('✖'), msg),
    dim: (msg: string) => console.log(chalk.dim(msg)),
    header: (msg: string) => console.log(chalk.bold.hex('#DEADED')(`\n${msg}\n`)),
    actionableError: (error: string, command: string, worktreePath?: string, nextSteps: string[] = []) => {
        console.log(chalk.red('\n✖ Error:'), error);
        console.log(chalk.dim('  Command:'), chalk.white(command));
        if (worktreePath) console.log(chalk.dim('  Path:   '), chalk.cyan(worktreePath));
        
        if (nextSteps.length > 0) {
            console.log(chalk.bold('\n  Next steps:'));
            nextSteps.forEach(step => console.log(chalk.yellow(`    - ${step}`)));
        }
        console.log('');
    },
};

// --- Initial Spinners ---

export const createSpinner = (text: string): Ora => {
    return ora({
        text,
        color: 'cyan',
        spinner: 'dots',
    });
};

// --- Prompts helpers ---

// Ensure consistency in UI
export const ui = {
    docLink: (url: string) => chalk.underline.cyan(url),
    code: (cmd: string) => chalk.bgBlack.white(` ${cmd} `),
    path: (p: string) => chalk.cyan(p),
};
