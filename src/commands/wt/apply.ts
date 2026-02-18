import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { log, ui, createSpinner } from '../../lib/ui.js';
import { findSandboxRoot, readSandboxMeta, writeSandboxMeta, AppliedFileBackup, YGGTREE_DIR } from '../../lib/sandbox.js';

export async function applyCommand() {
    try {
        const cwd = process.cwd();
        
        // 1. Find sandbox root
        const sandboxRoot = await findSandboxRoot(cwd);
        if (!sandboxRoot) {
            log.error('Not inside a sandbox worktree.');
            log.info(`Run ${chalk.cyan('yggtree wt create-sandbox')} to create one first.`);
            return;
        }

        // 2. Read sandbox metadata
        const meta = await readSandboxMeta(sandboxRoot);
        if (!meta) {
            log.error('Could not read sandbox metadata.');
            return;
        }

        log.info(`Sandbox: ${chalk.cyan(path.basename(sandboxRoot))}`);
        log.info(`Origin: ${chalk.dim(meta.originPath)} (${chalk.yellow(meta.originBranch)})`);

        // 3. Get list of changed files (including untracked)
        const spinner = createSpinner('Detecting changes...').start();
        
        let changedFiles: string[] = [];
        try {
            const { stdout: diffFiles } = await execa('git', ['diff', '--name-only', 'HEAD'], { cwd: sandboxRoot });
            const { stdout: stagedFiles } = await execa('git', ['diff', '--name-only', '--cached'], { cwd: sandboxRoot });
            const { stdout: untrackedFiles } = await execa('git', ['ls-files', '--others', '--exclude-standard'], { cwd: sandboxRoot });
            
            const allChanges = new Set([
                ...diffFiles.split('\n').filter(Boolean),
                ...stagedFiles.split('\n').filter(Boolean),
                ...untrackedFiles.split('\n').filter(Boolean)
            ]);
            // Exclude internal .yggtree/ directory (config, sandbox metadata, etc.)
            for (const file of allChanges) {
                if (file.startsWith(`${YGGTREE_DIR}/`)) {
                    allChanges.delete(file);
                }
            }
            changedFiles = [...allChanges];
        } catch (e: any) {
            spinner.fail('Failed to detect changes.');
            log.error(e.message);
            return;
        }

        if (changedFiles.length === 0) {
            spinner.info('No changes detected.');
            return;
        }

        spinner.succeed(`Found ${changedFiles.length} changed file(s).`);
        
        // Show changes
        console.log(chalk.dim('\n  Changed files:'));
        for (const file of changedFiles) {
            console.log(chalk.yellow(`    ${file}`));
        }
        console.log('');

        // 4. Confirm apply
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Apply ${changedFiles.length} file(s) to origin?`,
                default: true,
            }
        ]);

        if (!confirm) {
            log.info('Cancelled.');
            return;
        }

        // 5. Backup original files and copy
        const applySpinner = createSpinner('Applying changes...').start();
        const backups: AppliedFileBackup[] = [];

        for (const relativePath of changedFiles) {
            const originFile = path.join(meta.originPath, relativePath);
            const sandboxFile = path.join(sandboxRoot, relativePath);

            // Skip if sandbox file doesn't exist or is a directory
            if (!await fs.pathExists(sandboxFile)) {
                continue;
            }
            const sandboxStat = await fs.stat(sandboxFile);
            if (sandboxStat.isDirectory()) {
                continue; // Skip directories (e.g., submodules)
            }

            // Backup original content (or null if didn't exist)
            let originalContent: string | null = null;
            if (await fs.pathExists(originFile)) {
                const originStat = await fs.stat(originFile);
                if (originStat.isFile()) {
                    originalContent = await fs.readFile(originFile, 'utf-8');
                }
            }
            backups.push({ relativePath, originalContent });

            // Copy from sandbox to origin
            await fs.ensureDir(path.dirname(originFile));
            await fs.copy(sandboxFile, originFile);
        }

        // 6. Update metadata with backups
        meta.appliedFiles = backups;
        await writeSandboxMeta(sandboxRoot, meta);

        applySpinner.succeed(`Applied ${changedFiles.length} file(s) to origin.`);
        log.info(`Use ${chalk.cyan('yggtree wt unapply')} to undo these changes.`);

        // 7. Offer to delete sandbox
        log.warning(`If you delete this sandbox, you won't be able to run ${chalk.cyan('unapply')} later.`);
        const { shouldDelete } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldDelete',
                message: 'Delete this sandbox worktree?',
                default: false,
            }
        ]);

        if (shouldDelete) {
            const deleteSpinner = createSpinner('Deleting sandbox...').start();
            try {
                await execa('git', ['worktree', 'remove', sandboxRoot, '--force'], { cwd: meta.originPath });
                deleteSpinner.succeed('Sandbox deleted.');
                log.info(`Returning to origin: ${ui.path(meta.originPath)}`);
            } catch (e: any) {
                deleteSpinner.fail('Failed to delete sandbox.');
                log.warning('You can delete it manually with: yggtree wt delete');
            }
        }

    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt apply');
        process.exit(1);
    }
}
