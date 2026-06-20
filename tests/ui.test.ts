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
        expect(banner).toContain('Run: yggtree update');
    });

    it('renders a route intro before the main menu question', () => {
        const intro = renderMainMenuIntro({ context: 'main' });

        expect(intro).toContain('Choose the next realm action.');
        expect(intro).toContain('route 01');
        expect(intro).toContain('Realm');
        expect(intro).toContain('Create, enter, inspect, or tend your worktrees.');
    });

    it('renders a sandbox-specific intro when sandbox actions are available', () => {
        const intro = renderMainMenuIntro({ context: 'sandbox' });

        expect(intro).toContain('Sandbox tools appear first');
    });

    it('renders a worktree-specific intro for regular worktrees', () => {
        const intro = renderMainMenuIntro({ context: 'worktree' });

        expect(intro).toContain('Current-realm tools appear first');
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
