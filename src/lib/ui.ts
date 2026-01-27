import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import ora, { Ora } from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Personality & Branding ---

export const welcome = async () => {
    console.log('');
    const title = figlet.textSync('ANVIL CLI', { font: 'Standard' });
    console.log(gradient.pastel.multiline(title));
    console.log(chalk.dim('  v0.0.1 • Managed Worktrees Assistant'));
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
