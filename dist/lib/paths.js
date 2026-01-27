import os from 'os';
import path from 'path';
export const AGENTS_ROOT = path.join(os.homedir(), '.agents');
export const WORKTREES_ROOT = path.join(AGENTS_ROOT, 'worktrees');
