import { Command } from 'commander';
import inquirer from 'inquirer';
import { welcome, log } from './lib/ui.js';

import { listCommand } from './commands/wt/list.js';
import { createCommand } from './commands/wt/create.js';
import { createCommandNew } from './commands/wt/create-branch.js';
import { createCommandMulti } from './commands/wt/create-multi.js';
import { deleteCommand } from './commands/wt/delete.js';
import { bootstrapCommand } from './commands/wt/bootstrap.js';
import { pruneCommand } from './commands/wt/prune.js';
import { execCommand } from './commands/wt/exec.js';
import { enterCommand } from './commands/wt/enter.js';

const program = new Command();

program
    .name('yggtree')
    .description('Interactive CLI for managing git worktrees and configs')
    .version('1.0.0')
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
                    { name: '🌳 Create multiple worktrees', value: 'create-multi' },
                    { name: '🌱 Create new worktree (Manual Slug)', value: 'create-slug' },
                    { name: '📋 List worktrees', value: 'list' },
                    { name: '🗑️  Delete worktree', value: 'delete' },
                     { name: '🚀 Bootstrap worktree', value: 'bootstrap' },
                    { name: '🧹 Prune stale worktrees', value: 'prune' },
                    { name: '🐚 Exec command', value: 'exec' },
                    { name: '🚪 Enter worktree', value: 'enter' },
                    new inquirer.Separator(),
                    { name: '🚪 Exit', value: 'exit' },
                ],
            },
        ]);

        switch (action) {
            case 'create-smart':
                await createCommandNew({ bootstrap: true });
                break;
            case 'create-multi':
                await createCommandMulti({ bootstrap: true });
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
            case 'exec':
                await execCommand();
                break;
            case 'enter':
                await enterCommand();
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

wt.command('create [branch]')
    .description('Create a new worktree (Smart branch detection)')
    .option('-b, --branch <name>', 'Branch name (e.g. feat/new-ui)')
    .option('--base <ref>', 'Base ref (e.g. main)')
    .option('--source <type>', 'Base source (local or remote)')
    .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
    .option('--enter', 'Enter sub-shell after creation')
    .option('--no-enter', 'Skip entering sub-shell')
    .option('--exec <command>', 'Command to execute after creation')
    .action(async (branch, options) => {
        await createCommandNew({ 
            ...options, 
            branch: branch || options.branch 
        });
    });

wt.command('create-multi')
    .description('Create multiple worktrees (Smart branch detection)')
    .option('--base <ref>', 'Base ref (e.g. main)')
    .option('--source <type>', 'Base source (local or remote)')
    .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
    .action(async (options) => {
        await createCommandMulti(options);
    });

wt.command('create-slug [name] [ref]')
    .description('Create a new worktree (Manual slug/ref)')
    .option('-n, --name <slug>', 'Worktree name (slug)')
    .option('-r, --ref <ref>', 'Existing branch or ref')
    .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
    .option('--enter', 'Enter sub-shell after creation')
    .option('--no-enter', 'Skip entering sub-shell')
    .option('--exec <command>', 'Command to execute after creation')
    .action(async (name, ref, options) => {
        await createCommand({ 
            ...options, 
            name: name || options.name,
            ref: ref || options.ref
        });
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

wt.command('exec')
    .description('Execute a command in a worktree')
    .argument('[worktree]', 'Worktree name or path')
    .argument('[command...]', 'Command and arguments to execute')
    .action(async (worktree, command) => {
        await execCommand(worktree, command);
    });

wt.command('enter')
    .description('Enter a worktree sub-shell')
    .argument('[worktree]', 'Worktree name or path')
    .option('--exec <command>', 'Command to execute before entering')
    .action(async (worktree, options) => {
        await enterCommand(worktree, options);
    });

program.parse(process.argv);
