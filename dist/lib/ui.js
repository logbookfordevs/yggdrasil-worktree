import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import ora from 'ora';
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
    info: (msg) => console.log(chalk.blue('ℹ'), msg),
    success: (msg) => console.log(chalk.green('✔'), msg),
    warning: (msg) => console.log(chalk.yellow('⚠'), msg),
    error: (msg) => console.log(chalk.red('✖'), msg),
    dim: (msg) => console.log(chalk.dim(msg)),
    header: (msg) => console.log(chalk.bold.hex('#DEADED')(`\n${msg}\n`)),
};
// --- Initial Spinners ---
export const createSpinner = (text) => {
    return ora({
        text,
        color: 'cyan',
        spinner: 'dots',
    });
};
// --- Prompts helpers ---
// Ensure consistency in UI
export const ui = {
    docLink: (url) => chalk.underline.cyan(url),
    code: (cmd) => chalk.bgBlack.white(` ${cmd} `),
    path: (p) => chalk.cyan(p),
};
