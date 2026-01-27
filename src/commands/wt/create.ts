import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { getRepoRoot, verifyRef, createWorktree, fetchAll, syncSubmodules } from '../../lib/git.js';
import { WORKTREES_ROOT } from '../../lib/paths.js';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { execa } from 'execa';

interface CreateOptions {
    name?: string;
    ref?: string;
    bootstrap: boolean;
}

export async function createCommand(options: CreateOptions) {
    try {
        const repoRoot = await getRepoRoot();
        log.info(`Repo: ${chalk.dim(repoRoot)}`);

        // 1. Gather inputs
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Worktree name (slug):',
                default: options.name,
                when: !options.name,
                validate: (input) => input.trim().length > 0 || 'Name is required',
            },
            {
                type: 'input',
                name: 'ref',
                message: 'Existing branch/ref to use:',
                default: options.ref,
                when: !options.ref,
                validate: (input) => input.trim().length > 0 || 'Ref is required',
            },
            {
                type: 'confirm',
                name: 'bootstrap',
                message: 'Run bootstrap? (npm install + submodules)',
                default: true,
                when: options.bootstrap !== false, // Skip if explicitly disabled via flag
            },
        ]);

        const name = options.name || answers.name;
        const ref = options.ref || answers.ref;
        // If flag is false, prompt is skipped and we use false. 
        // If flag is true (default), we use prompt answer.
        const shouldBootstrap = options.bootstrap === false ? false : answers.bootstrap;
        
        const slug = name.replace(/\s+/g, '-');
        const wtPath = path.join(WORKTREES_ROOT, slug);

        // 2. Validation
        if (!slug) throw new Error('Invalid name');
        if (!ref) throw new Error('Invalid ref');

        // 3. Execution
        const spinner = createSpinner('Fetching...').start();
        await fetchAll();
        spinner.text = 'Verifying ref...';

        const exists = await verifyRef(ref);
        if (!exists) {
            spinner.fail(`Ref not found: ${ref}`);
            log.warning(`Tip: try 'origin/${ref}' or check if the branch exists.`);
            return;
        }

        spinner.text = `Creating worktree at ${ui.path(wtPath)}...`;
        try {
            await createWorktree(wtPath, ref);
            spinner.succeed('Worktree created.');
        } catch (e: any) {
            spinner.fail('Failed to create worktree.');
            log.error(e.message);
            return;
        }

        // 4. Bootstrap
        if (shouldBootstrap) {
            log.info('Bootstrapping...');
            
            // Check for npm
            try {
                await execa('npm', ['--version']);
                const installSpinner = createSpinner('Running npm install...').start();
                try {
                    await execa('npm', ['install'], { cwd: wtPath });
                    installSpinner.succeed('Dependencies installed.');
                } catch (e: any) {
                    installSpinner.fail('npm install failed.');
                    log.error(e.message);
                }
            } catch {
                log.warning('npm not found, skipping install.');
            }

            const subSpinner = createSpinner('Syncing submodules...').start();
            try {
                await syncSubmodules(wtPath);
                subSpinner.succeed('Submodules synced.');
            } catch (e: any) {
                subSpinner.fail('Submodule sync failed.');
                log.error(e.message);
                log.warning('Tip: If auth failed, try adding your key to the agent.');
            }
        }

        // 5. Final Output
        log.success('Worktree ready!');
        log.header(`cd "${wtPath}"`);

    } catch (error: any) {
        log.error(error.message);
        process.exit(1);
    }
}
