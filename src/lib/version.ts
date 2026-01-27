import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getVersion(): string {
    try {
        // In dist, this file is in dist/lib/version.js
        // package.json is in the root (../../package.json)
        const packageJsonPath = path.resolve(__dirname, '../../package.json');
        const pkg = fs.readJsonSync(packageJsonPath);
        return pkg.version || '1.0.0';
    } catch (error) {
        return '1.0.0';
    }
}
