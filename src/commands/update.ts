import { execa } from 'execa';
import { log } from '../lib/ui.js';

export const INSTALL_COMMAND = 'curl -fsSL https://yggtree.logbookfordevs.com/install.sh | bash';

export async function updateCommand(): Promise<void> {
    log.info('Installing the latest Yggtree release...');
    log.dim(`Run: ${INSTALL_COMMAND}`);

    await execa('bash', ['-c', INSTALL_COMMAND], {
        stdio: 'inherit',
    });
}
