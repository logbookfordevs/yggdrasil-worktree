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

interface WelcomeOptions {
    update?: {
        currentVersion: string;
        latestVersion: string;
        updateAvailable: boolean;
    } | null;
}

interface MainMenuIntroOptions {
    context: 'main' | 'worktree' | 'sandbox';
}

interface MainMenuChoiceOptions {
    glyph: string;
    label: string;
    detail: string;
    tone: MenuTone;
}

type MenuTone = 'growth' | 'travel' | 'sandbox' | 'tending' | 'danger' | 'lore' | 'exit';

const yggAccent = chalk.hex('#DEADED');
const yggLeaf = chalk.hex('#9AD68B');
const yggSky = chalk.hex('#7AC7D8');
const yggBark = chalk.hex('#C99A5B');
const yggRoot = chalk.hex('#B48AE8');
const yggWarn = chalk.hex('#E4B85E');
const yggDanger = chalk.hex('#E06C75');
const yggMuted = chalk.hex('#8D8D8D');

export function renderWelcome(options: WelcomeOptions = {}): string {
    const rule = yggAccent('─'.repeat(54));
    const title = figlet.textSync('Yggdrasil', { font: 'Standard' });
    const version = getVersion();
    const updateLines = renderUpdateNotice(options.update);

    return [
        '',
        rule,
        gradient.mind.multiline(title),
        chalk.bold(yggAccent('  Yggdrasil')),
        chalk.dim(`  v${version} • The World Tree Worktree Assistant`),
        ...updateLines,
        rule,
        '',
    ].join('\n');
}

export const welcome = async (options: WelcomeOptions = {}) => {
    console.log(renderWelcome(options));
};

export function renderMainMenuIntro(options: MainMenuIntroOptions): string {
    const detail = (() => {
        if (options.context === 'sandbox') {
            return 'Sandbox tools appear first because this realm can apply or undo grafted changes.';
        }

        if (options.context === 'worktree') {
            return 'Current-realm tools appear first for this worktree.';
        }

        return 'Create, enter, inspect, or tend your worktrees.';
    })();

    return [
        'Choose the next realm action.',
        yggMuted('Daily routes first. Maintenance and lore wait below.'),
        '',
        `${yggBark('┌')}   ${badge('route 01')} ${chalk.bold('Realm')}`,
        `${yggBark('│')}   ${yggMuted(detail)}`,
    ].join('\n');
}

export function formatMainMenuChoice(options: MainMenuChoiceOptions): string {
    const tone = menuTone(options.tone);
    const label = options.label.padEnd(24);

    return `${tone(options.glyph)}  ${chalk.bold(label)} ${yggMuted(options.detail)}`;
}

function renderUpdateNotice(update: WelcomeOptions['update']): string[] {
    if (!update?.updateAvailable) return [];

    return [
        '',
        `${yggWarn('Update available')} ${yggMuted(`yggtree ${update.currentVersion} -> ${update.latestVersion}`)}`,
        yggMuted('Run: npm install -g yggtree'),
    ];
}

function badge(value: string): string {
    return yggRoot(` ${value} `);
}

function menuTone(tone: MenuTone): (value: string) => string {
    switch (tone) {
        case 'growth':
            return yggLeaf;
        case 'travel':
            return yggSky;
        case 'sandbox':
            return yggRoot;
        case 'tending':
            return yggBark;
        case 'danger':
            return yggDanger;
        case 'lore':
            return yggAccent;
        case 'exit':
            return yggMuted;
    }
}

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

// --- Time helpers ---

/**
 * Returns a human-friendly relative time string like "just now", "5 min ago", "3 days ago".
 */
export function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60)          return 'just now';
    if (seconds < 3600)        return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400)       return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800)      return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000)     return `${Math.floor(seconds / 604800)}w ago`;
    if (seconds < 31536000)    return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
}
