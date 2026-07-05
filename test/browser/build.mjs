// Bundle the browser harness (scratch-vm + WebGL renderer) for Playwright.
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));

await build({
    entryPoints: [path.join(dir, 'harness.entry.js')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    outfile: path.join(dir, 'harness.bundle.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'error',
});
console.log('harness bundled');
