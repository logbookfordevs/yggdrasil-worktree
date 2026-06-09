import { describe, expect, it } from 'vitest';
import {
    formatMainMenuChoice,
    renderMainMenuIntro,
    renderWelcome,
} from '../src/lib/ui.js';

describe('terminal UI', () => {
    it('renders update notices inside the welcome frame', () => {
        const banner = renderWelcome({
            update: {
                currentVersion: '1.4.4',
                latestVersion: '1.5.0',
                updateAvailable: true,
            },
        });

        expect(banner).toContain('Yggdrasil');
        expect(banner).toContain('The World Tree Worktree Assistant');
        expect(banner).toContain('Update available');
        expect(banner).toContain('yggtree 1.4.4 -> 1.5.0');
        expect(banner).toContain('Run: npm install -g yggtree');
    });

    it('renders a route intro before the main menu question', () => {
        const intro = renderMainMenuIntro({ isInSandbox: false });

        expect(intro).toContain('Choose the next realm action.');
        expect(intro).toContain('route 01');
        expect(intro).toContain('Realm');
        expect(intro).toContain('Create, enter, inspect, or tend your worktrees.');
    });

    it('formats menu choices with a glyph rail, label, and detail', () => {
        const choice = formatMainMenuChoice({
            glyph: '◆',
            label: 'Grow new realm',
            detail: 'create a branch-backed worktree',
            tone: 'growth',
        });

        expect(choice).toContain('◆');
        expect(choice).toContain('Grow new realm');
        expect(choice).toContain('create a branch-backed worktree');
    });
});
