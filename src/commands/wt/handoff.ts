import { createSandboxCommand } from './create-sandbox.js';

interface HandoffOptions {
    name?: string;
    bootstrap?: boolean;
    open?: boolean;
    enter?: boolean;
    exec?: string;
}

export async function handoffCommand(options: HandoffOptions = {}) {
    await createSandboxCommand({
        ...options,
        carry: true,
    });
}
