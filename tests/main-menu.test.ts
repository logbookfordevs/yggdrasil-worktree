import { describe, expect, it } from 'vitest';
import { buildMainMenuEntries, MainMenuAction, MainMenuContext } from '../src/lib/main-menu.js';

function actionsFor(context: MainMenuContext): MainMenuAction[] {
    return buildMainMenuEntries(context)
        .filter((entry): entry is { type: 'action'; value: MainMenuAction } => entry.type === 'action')
        .map(entry => entry.value);
}

describe('main menu entries', () => {
    it('hides sandbox graft actions outside sandbox context', () => {
        expect(actionsFor('main')).not.toContain('apply');
        expect(actionsFor('main')).not.toContain('unapply');
        expect(actionsFor('worktree')).not.toContain('apply');
        expect(actionsFor('worktree')).not.toContain('unapply');
    });

    it('prioritizes sandbox graft actions inside sandbox context', () => {
        expect(actionsFor('sandbox').slice(0, 2)).toEqual(['apply', 'unapply']);
    });

    it('keeps regular worktree menus additive instead of restrictive', () => {
        const actions = actionsFor('worktree');

        expect(actions.slice(0, 5)).toEqual(actionsFor('main').slice(0, 5));
        expect(actions).toContain('create-smart');
        expect(actions).toContain('worktree-checkout');
        expect(actions).toContain('create-sandbox');
        expect(actions).toContain('copy-env');
    });

    it('only shows current-realm env actions inside a regular worktree', () => {
        expect(actionsFor('main')).not.toContain('copy-env');
        expect(actionsFor('sandbox')).not.toContain('copy-env');
        expect(actionsFor('worktree')).toContain('copy-env');
    });
});
