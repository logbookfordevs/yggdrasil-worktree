import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { welcome, log } from './lib/ui.js';

import { listCommand } from './commands/wt/list.js';
import { createCommand } from './commands/wt/create.js';
import { createCommandNew } from './commands/wt/create-branch.js';
import { createCommandMulti } from './commands/wt/create-multi.js';
import { createSandboxCommand } from './commands/wt/create-sandbox.js';
import { deleteCommand } from './commands/wt/delete.js';
import { bootstrapCommand } from './commands/wt/bootstrap.js';
import { pruneCommand } from './commands/wt/prune.js';
import { execCommand } from './commands/wt/exec.js';
import { enterCommand } from './commands/wt/enter.js';
import { pathCommand } from './commands/wt/path.js';
import { openCommand } from './commands/wt/open.js';
import { applyCommand } from './commands/wt/apply.js';
import { unapplyCommand } from './commands/wt/unapply.js';
import { getVersion } from './lib/version.js';
import { findSandboxRoot } from './lib/sandbox.js';

const program = new Command();

program
    .name('yggtree')
    .description('Interactive CLI for managing git worktrees and configs')
    .version(getVersion())
    .action(async () => {
        // Interactive Menu if no command is provided
        await welcome();
        const isInSandbox = Boolean(await findSandboxRoot(process.cwd()));

        const realmChoices = [
            { name: `🌿 Grow New Realm ${chalk.dim('(create worktree)')}`, value: 'create-smart' },
            { name: `🔀 Traverse to Another Realm ${chalk.dim('(checkout existing branch in new worktree)')}`, value: 'worktree-checkout' },
            { name: `🌳 Grow Many Realms ${chalk.dim('(create multiple worktrees)')}`, value: 'create-multi' },
            { name: `🧪 Forge Sandbox Realm ${chalk.dim('(create sandbox worktree)')}`, value: 'create-sandbox' },
            { name: `🗺️ Survey Realms ${chalk.dim('(list worktrees)')}`, value: 'list' },
            { name: `🧭 Open Realm in IDE ${chalk.dim('(open worktree in editor)')}`, value: 'open' },
            { name: `🪓 Fell a Realm ${chalk.dim('(delete worktree)')}`, value: 'delete' },
            { name: `🚀 Bless Realm Setup ${chalk.dim('(bootstrap worktree)')}`, value: 'bootstrap' },
            { name: `🧹 Prune Withered Realms ${chalk.dim('(prune stale worktrees)')}`, value: 'prune' },
            { name: `🐚 Cast a Command ${chalk.dim('(exec command in worktree)')}`, value: 'exec' },
            { name: `🚪 Enter Realm Shell ${chalk.dim('(enter worktree)')}`, value: 'enter' },
            { name: `📍 Reveal Realm Path ${chalk.dim('(show worktree path)')}`, value: 'path' },
        ];

        const sandboxChoices = [
            { name: `✅ Graft Sandbox Changes ${chalk.dim('(apply sandbox changes)')}`, value: 'apply' },
            { name: `↩️ Undo Sandbox Graft ${chalk.dim('(unapply sandbox changes)')}`, value: 'unapply' },
        ];

        const choices = isInSandbox
            ? [
                ...sandboxChoices,
                new inquirer.Separator(),
                ...realmChoices,
                new inquirer.Separator(),
                { name: `🚪 Leave Yggdrasil ${chalk.dim('(exit)')}`, value: 'exit' },
            ]
            : [
                ...realmChoices,
                new inquirer.Separator(),
                ...sandboxChoices,
                new inquirer.Separator(),
                { name: `🚪 Leave Yggdrasil ${chalk.dim('(exit)')}`, value: 'exit' },
            ];
        
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                loop: false,
                pageSize: 12,
                choices,
            },
        ]);

        switch (action) {
            case 'create-smart':
                await createCommandNew({ bootstrap: true });
                break;
            case 'create-multi':
                await createCommandMulti({ bootstrap: true });
                break;
            case 'worktree-checkout':
                await createCommand({ bootstrap: true });
                break;
            case 'list':
                await listCommand();
                break;
            case 'open':
                await openCommand();
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
            case 'path':
                await pathCommand();
                break;
            case 'apply':
                await applyCommand();
                break;
            case 'unapply':
                await unapplyCommand();
                break;
            case 'create-sandbox':
                await createSandboxCommand({ bootstrap: true });
                break;
            case 'exit':
                log.info('Bye! 👋');
                process.exit(0);
        }
    });

// --- Worktree Commands ---
const wt = program.command('wt').description('Manage git worktrees');

wt.command('list')
    .description('List all repo-linked worktrees')
    .option('--open', 'Open a worktree in an IDE instead of listing')
    .action(async (options) => {
        if (options.open) {
            await openCommand();
            return;
        }
        await listCommand();
    });

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

wt.command('worktree-checkout [name] [ref]')
    .description('Create a checkout-style worktree from an existing branch')
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
    .description('Delete managed worktrees')
    .option('-a, --all', 'Include repo-linked worktrees outside ~/.yggtree (except main/current)')
    .action(async (options) => {
        await deleteCommand(options);
    });

wt.command('open [worktree]')
    .description('Open a worktree in an IDE')
    .option('--ide <command>', 'IDE command to use (e.g. cursor, code, zed)')
    .action(async (worktree, options) => {
        await openCommand(worktree, options);
    });

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

wt.command('path [worktree]')
    .description('Show the cd command for a specific worktree')
    .action(async (worktree) => {
        await pathCommand(worktree);
    });

wt.command('create-sandbox')
    .description('Create a sandbox worktree from current branch')
    .option('--carry', 'Carry uncommitted changes to sandbox')
    .option('--no-carry', 'Do not carry uncommitted changes')
    .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
    .option('--enter', 'Enter sub-shell after creation')
    .option('--no-enter', 'Skip entering sub-shell')
    .option('--exec <command>', 'Command to execute after creation')
    .action(async (options) => {
        await createSandboxCommand(options);
    });

wt.command('apply')
    .description('Apply sandbox changes to origin directory')
    .action(applyCommand);

wt.command('unapply')
    .description('Undo applied sandbox changes in origin')
    .action(unapplyCommand);

program.parse(process.argv);
