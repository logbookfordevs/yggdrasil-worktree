import { Command, Option } from 'commander';
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
import { pathCommand } from './commands/wt/path.js';
import { openCommand } from './commands/wt/open.js';
import { applyCommand } from './commands/wt/apply.js';
import { unapplyCommand } from './commands/wt/unapply.js';
import { handoffCommand } from './commands/wt/handoff.js';
import { getVersion } from './lib/version.js';
import { notifyIfUpdateAvailable } from './lib/update-check.js';
import { findSandboxRoot } from './lib/sandbox.js';
import { bifrostCommand } from './commands/bifrost.js';
import { thorCommand } from './commands/thor.js';

const program = new Command();
const argv = process.argv.map((arg) => arg === '-v' || arg === '—version' ? '--version' : arg);

function registerWorktreeCommands(parent: Command) {
    parent.command('list')
        .description('List all repo-linked worktrees')
        .option('--open', 'Open a worktree in an IDE/agent tool instead of listing')
        .action(async (options) => {
            if (options.open) {
                await openCommand();
                return;
            }
            await listCommand();
        });

    parent.command('create [branch]')
        .description('Create a new worktree (Smart branch detection)')
        .option('-b, --branch <name>', 'Branch name (e.g. feat/new-ui)')
        .option('--base <ref>', 'Base ref (e.g. main)')
        .option('--source <type>', 'Base source (local or remote)')
        .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
        .option('--open', 'Open an editor after creation')
        .option('--no-open', 'Skip opening an editor after creation')
        .option('--enter', 'Enter the worktree sub-shell after creation')
        .option('--no-enter', 'Do not enter the worktree sub-shell after creation')
        .option('--exec <command>', 'Command to execute after creation')
        .action(async (branch, options) => {
            await createCommandNew({
                ...options,
                branch: branch || options.branch
            });
        });

    parent.command('create-multi')
        .description('Create multiple worktrees (Smart branch detection)')
        .option('--base <ref>', 'Base ref (e.g. main)')
        .option('--source <type>', 'Base source (local or remote)')
        .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
        .action(async (options) => {
            await createCommandMulti(options);
        });

    const registerWorktreeCheckout = (commandName: string, description: string) => {
        parent.command(`${commandName} [name] [ref]`)
            .description(description)
            .option('-n, --name <slug>', 'Worktree name (slug)')
            .option('-r, --ref <ref>', 'Existing branch or ref')
            .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
            .option('--open', 'Open editors or run a startup command before entering')
            .option('--no-open', 'Skip opening editors or startup commands before entering')
            .option('--tool <command>', 'Editor or app command to open after checkout (skips open prompt)')
            .addOption(new Option('--enter', 'Enter the worktree sub-shell after checkout/opening').hideHelp())
            .option('--no-enter', 'Do not enter the worktree sub-shell after checkout/opening')
            .option('--exec <command>', 'Command to execute after creation')
            .action(async (name, ref, options) => {
                await createCommand({
                    ...options,
                    name: name || options.name,
                    ref: ref || options.ref
                });
            });
    };

    registerWorktreeCheckout('worktree-checkout', 'Create a checkout-style worktree from an existing branch');
    registerWorktreeCheckout('wc', 'Alias for worktree-checkout');

    parent.command('delete')
        .description('Delete managed worktrees')
        .option('-a, --all', 'Include repo-linked worktrees outside ~/.yggtree (except main/current)')
        .action(async (options) => {
            await deleteCommand(options);
        });

    parent.command('open [worktree]')
        .description('Open a worktree in an editor or supported app')
        .option('--tool <command>', 'Editor or app command to use (e.g. cursor, code, codex-app)')
        .option('--enter', 'Enter the worktree sub-shell after opening')
        .addOption(new Option('--no-enter', 'Do not enter the worktree sub-shell after opening').hideHelp())
        .action(async (worktree, options) => {
            await openCommand(worktree, options);
        });

    parent.command('bootstrap')
        .description('Bootstrap dependencies in a worktree')
        .action(bootstrapCommand);

    parent.command('prune')
        .description('Prune stale worktree information')
        .action(pruneCommand);

    parent.command('exec')
        .description('Execute a command in a worktree')
        .argument('[worktree]', 'Worktree name or path')
        .argument('[command...]', 'Command and arguments to execute')
        .action(async (worktree, command) => {
            await execCommand(worktree, command);
        });

    parent.command('path [worktree]')
        .description('Show the cd command for a specific worktree')
        .action(async (worktree) => {
            await pathCommand(worktree);
        });

    parent.command('create-sandbox')
        .description('Create a sandbox worktree from current branch')
        .option('-n, --name <name>', 'Optional sandbox name (auto-generated when omitted)')
        .option('--carry', 'Carry uncommitted changes to sandbox')
        .option('--no-carry', 'Do not carry uncommitted changes')
        .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
        .option('--open', 'Open an editor after creation')
        .option('--no-open', 'Skip opening an editor after creation')
        .addOption(new Option('--enter', 'Deprecated alias for --open').hideHelp())
        .addOption(new Option('--no-enter', 'Deprecated alias for --no-open').hideHelp())
        .option('--exec <command>', 'Command to execute after creation')
        .action(async (options) => {
            await createSandboxCommand(options);
        });

    parent.command('handoff')
        .description('Carry uncommitted work into a sandbox worktree')
        .option('-n, --name <name>', 'Optional handoff name (prompted when omitted)')
        .option('--no-bootstrap', 'Skip bootstrap (npm install + submodules)')
        .option('--open', 'Open an editor after creation')
        .option('--no-open', 'Skip opening an editor after creation')
        .addOption(new Option('--enter', 'Deprecated alias for --open').hideHelp())
        .addOption(new Option('--no-enter', 'Deprecated alias for --no-open').hideHelp())
        .option('--exec <command>', 'Command to execute after creation')
        .action(async (options) => {
            await handoffCommand(options);
        });

    parent.command('apply')
        .description('Apply sandbox changes to origin directory')
        .action(applyCommand);

    parent.command('unapply')
        .description('Undo applied sandbox changes in origin')
        .action(unapplyCommand);
}

function rejectUnknownTopLevelCommand(args: string[]) {
    const commandArg = args.slice(2).find(arg => !arg.startsWith('-'));
    if (!commandArg) return;
    if (commandArg === 'help') return;

    const knownCommands = new Set(
        program.commands.flatMap(command => [command.name(), ...command.aliases()])
    );
    if (!knownCommands.has(commandArg)) {
        program.error(`error: unknown command '${commandArg}'`);
    }
}

program
    .name('yggtree')
    .description('Interactive CLI for managing git worktrees and configs')
    .version(getVersion())
    .allowExcessArguments(false)
    .action(async () => {
        // Interactive Menu if no command is provided
        await welcome();
        await notifyIfUpdateAvailable();
        const isInSandbox = Boolean(await findSandboxRoot(process.cwd()));

        const realmChoices = [
            { name: `🌿 Grow New Realm ${chalk.dim('(create worktree)')}`, value: 'create-smart' },
            { name: `🔀 Traverse to Another Realm ${chalk.dim('(checkout existing branch in new worktree)')}`, value: 'worktree-checkout' },
            { name: `🌳 Grow Many Realms ${chalk.dim('(create multiple worktrees)')}`, value: 'create-multi' },
            { name: `🤝 Hand Off Current Work ${chalk.dim('(carry dirty work into a sandbox)')}`, value: 'handoff' },
            { name: `🧪 Forge Sandbox Realm ${chalk.dim('(create sandbox worktree)')}`, value: 'create-sandbox' },
            { name: `🗺️  Survey Realms ${chalk.dim('(list worktrees)')}`, value: 'list' },
            { name: `🧭 Open Realm in Editor ${chalk.dim('(open worktree in editor)')}`, value: 'open' },
            { name: `🪓 Fell a Realm ${chalk.dim('(delete worktree)')}`, value: 'delete' },
            { name: `🚀 Bless Realm Setup ${chalk.dim('(bootstrap worktree)')}`, value: 'bootstrap' },
            { name: `🧹 Prune Withered Realms ${chalk.dim('(prune stale worktrees)')}`, value: 'prune' },
            { name: `🐚 Cast a Command ${chalk.dim('(exec command in worktree)')}`, value: 'exec' },
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
                { name: `🌈 Summon the Bifrost ${chalk.dim('(easter egg)')}`, value: 'bifrost' },
                { name: `⚡ Consult Thor ${chalk.dim('(easter egg)')}`, value: 'thor' },
                { name: `🚪 Leave Yggdrasil ${chalk.dim('(exit)')}`, value: 'exit' },
            ]
            : [
                ...realmChoices,
                new inquirer.Separator(),
                ...sandboxChoices,
                new inquirer.Separator(),
                { name: `🌈 Summon the Bifrost ${chalk.dim('(easter egg)')}`, value: 'bifrost' },
                { name: `⚡ Consult Thor ${chalk.dim('(easter egg)')}`, value: 'thor' },
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
            case 'handoff':
                await handoffCommand({ bootstrap: true });
                break;
            case 'bifrost':
                await bifrostCommand();
                break;
            case 'thor':
                await thorCommand();
                break;
            case 'exit':
                log.info('Bye! 👋');
                process.exit(0);
        }
    });

// --- Worktree Commands ---
const wt = program.command('wt').description('Manage git worktrees');
registerWorktreeCommands(program);
registerWorktreeCommands(wt);
program.addHelpCommand(true);

program.command('bifrost')
    .description('Summon the Bifrost (Easter Egg)')
    .action(bifrostCommand);

program.command('thor')
    .description('Consult the God of Thunder (Easter Egg)')
    .action(thorCommand);

rejectUnknownTopLevelCommand(argv);
program.parse(argv);
