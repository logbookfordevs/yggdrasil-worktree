export type MainMenuAction =
    | 'create-smart'
    | 'worktree-checkout'
    | 'create-multi'
    | 'handoff'
    | 'create-sandbox'
    | 'list'
    | 'open'
    | 'delete'
    | 'bootstrap'
    | 'prune'
    | 'exec'
    | 'path'
    | 'copy-env'
    | 'apply'
    | 'unapply'
    | 'bifrost'
    | 'thor'
    | 'exit';

export type MainMenuContext = 'main' | 'worktree' | 'sandbox';

export type MainMenuEntry =
    | { type: 'action'; value: MainMenuAction }
    | { type: 'separator'; label: string };

export function buildMainMenuEntries(context: MainMenuContext): MainMenuEntry[] {
    const dailyChoices = actions([
        'create-smart',
        'worktree-checkout',
        'handoff',
        'open',
        'list',
    ]);

    const growthChoices = actions([
        'create-multi',
        'create-sandbox',
    ]);

    const tendingChoices = actions([
        'bootstrap',
        'exec',
        'path',
        'delete',
        'prune',
    ]);

    const sandboxChoices = actions([
        'apply',
        'unapply',
    ]);

    const loreChoices = actions([
        'bifrost',
        'thor',
        'exit',
    ]);

    if (context === 'sandbox') {
        return [
            ...sandboxChoices,
            separator('Daily routes'),
            ...dailyChoices,
            separator('Growth and experiments'),
            ...growthChoices,
            separator('Tend realms'),
            ...tendingChoices,
            separator('Lore'),
            ...loreChoices,
        ];
    }

    if (context === 'worktree') {
        return [
            ...dailyChoices,
            separator('Growth and experiments'),
            ...growthChoices,
            separator('Tend realms'),
            ...tendingChoices,
            separator('Current realm'),
            ...actions(['copy-env']),
            separator('Lore'),
            ...loreChoices,
        ];
    }

    return [
        ...dailyChoices,
        separator('Growth and experiments'),
        ...growthChoices,
        separator('Tend realms'),
        ...tendingChoices,
        separator('Lore'),
        ...loreChoices,
    ];
}

function actions(values: MainMenuAction[]): MainMenuEntry[] {
    return values.map(value => ({ type: 'action', value }));
}

function separator(label: string): MainMenuEntry {
    return { type: 'separator', label };
}
