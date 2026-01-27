import os from 'os';
import path from 'path';

export const ANVIL_ROOT = path.join(os.homedir(), '.yggdrasil');
export const WORKTREES_ROOT = path.join(ANVIL_ROOT, 'worktrees');
