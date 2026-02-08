import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { log, createSpinner } from '../../lib/ui.js';
import { findSandboxRoot, readSandboxMeta, writeSandboxMeta } from '../../lib/sandbox.js';

export async function unapplyCommand() {
    try {
        const cwd = process.cwd();
        
        // 1. Find sandbox root
        const sandboxRoot = await findSandboxRoot(cwd);
        if (!sandboxRoot) {
            log.error('Not inside a sandbox worktree.');
            log.info(`This command only works inside a sandbox created with ${chalk.cyan('yggtree wt create-sandbox')}.`);
            return;
        }

        // 2. Read sandbox metadata
        const meta = await readSandboxMeta(sandboxRoot);
        if (!meta) {
            log.error('Could not read sandbox metadata.');
            return;
        }

        // 3. Check if there are applied changes to unapply
        if (!meta.appliedFiles || meta.appliedFiles.length === 0) {
            log.info('No applied changes to unapply.');
            log.dim('Use "yggtree wt apply" first to apply changes to origin.');
            return;
        }

        log.info(`Sandbox: ${chalk.cyan(path.basename(sandboxRoot))}`);
        log.info(`Origin: ${chalk.dim(meta.originPath)} (${chalk.yellow(meta.originBranch)})`);
        log.info(`Applied files: ${chalk.yellow(meta.appliedFiles.length)}`);

        // Show files that will be reverted
        console.log(chalk.dim('\n  Files to revert in origin:'));
        for (const backup of meta.appliedFiles) {
            const action = backup.originalContent === null ? '(delete)' : '(restore)';
            console.log(chalk.yellow(`    ${backup.relativePath} ${chalk.dim(action)}`));
        }
        console.log('');

        // 4. Confirm unapply
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Revert ${meta.appliedFiles.length} file(s) in origin?`,
                default: true,
            }
        ]);

        if (!confirm) {
            log.info('Cancelled.');
            return;
        }

        // 5. Restore original files
        const spinner = createSpinner('Reverting changes in origin...').start();

        for (const backup of meta.appliedFiles) {
            const originFile = path.join(meta.originPath, backup.relativePath);

            if (backup.originalContent === null) {
                // File was newly created by apply, delete it
                if (await fs.pathExists(originFile)) {
                    await fs.remove(originFile);
                }
            } else {
                // Restore original content
                await fs.ensureDir(path.dirname(originFile));
                await fs.writeFile(originFile, backup.originalContent, 'utf-8');
            }
        }

        // 6. Clear applied files from metadata
        const revertedCount = meta.appliedFiles.length;
        meta.appliedFiles = [];
        await writeSandboxMeta(sandboxRoot, meta);

        spinner.succeed(`Reverted ${revertedCount} file(s) in origin.`);
        log.info('Origin is back to its state before apply.');

    } catch (error: any) {
        log.actionableError(error.message, 'yggtree wt unapply');
        process.exit(1);
    }
}
