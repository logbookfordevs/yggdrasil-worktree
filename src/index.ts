import { Command } from 'commander';
import inquirer from 'inquirer';
import { welcome, log } from './lib/ui.js';

import { listCommand } from './commands/wt/list.js';
import { createCommand } from './commands/wt/create.js';
import { createCommandNew } from './commands/wt/create-branch.js';
import { deleteCommand } from './commands/wt/delete.js';
import { bootstrapCommand } from './commands/wt/bootstrap.js';
import { pruneCommand } from './commands/wt/prune.js';

const program = new Command();

program
    .name('anvil')
    .description('Interactive CLI for managing git worktrees and configs')
    .version('0.0.1')
    .action(async () => {
        // Interactive Menu if no command is provided
        await welcome();
        
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                loop: false,
                choices: [
                    { name: '🌿 Create new worktree (Smart Branch)', value: 'create-smart' },
                    { name: '🌱 Create new worktree (Manual Slug)', value: 'create-slug' },
                    { name: '📋 List worktrees', value: 'list' },
                    { name: '🗑️  Delete worktree', value: 'delete' },
                    { name: '🚀 Bootstrap worktree', value: 'bootstrap' },
                    { name: '🧹 Prune stale worktrees', value: 'prune' },
                    new inquirer.Separator(),
                    { name: '🚪 Exit', value: 'exit' },
                ],
            },
        ]);

        switch (action) {
            case 'create-smart':
                await createCommandNew({ bootstrap: true });
                break;
            case 'create-slug':
                await createCommand({ bootstrap: true });
                break;
            case 'list':
                await listCommand();
                break;
            case 'delete':
                await deleteCommand();
                break;
            case 'bootstrap':
                await bootstrapCommand();
                break;
            case 'prune':
                await pruneCommand();
                break;
            case 'exit':
                log.info('Bye! 👋');
                process.exit(0);
        }
    });

// --- Worktree Commands ---
const wt = program.command('wt').description('Manage git worktrees');

wt.command('list')
    .description('List all worktrees')
    .action(listCommand);

wt.command('create')
    .description('Create a new worktree (Smart branch detection)')
    .option('-b, --branch <name>', 'Branch name (e.g. feat/new-ui)')
    .option('--base <ref>', 'Base ref (e.g. main)')
    .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
    .action(async (options) => {
        await createCommandNew(options);
    });

wt.command('create-slug')
    .description('Create a new worktree (Manual slug/ref)')
    .option('-n, --name <slug>', 'Worktree name (slug)')
    .option('-r, --ref <ref>', 'Existing branch or ref')
    .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
    .action(async (options) => {
        await createCommand(options);
    });

wt.command('delete')
    .description('Delete a managed worktree')
    .action(deleteCommand);

wt.command('bootstrap')
    .description('Bootstrap dependencies in a worktree')
    .action(bootstrapCommand);

wt.command('prune')
    .description('Prune stale worktree information')
    .action(pruneCommand);

program.parse(process.argv);
