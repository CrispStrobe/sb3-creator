// Drive test/browser/oracle.entry.js (vanilla scratch-vm + real WebGL renderer) in
// headless Chromium. The page is served from the file system; one browser is reused
// across projects. Uses the shared Chromium when PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
// is set (never downloads a browser itself).
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

const page_ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'browser', 'oracle.html');
let browser = null, page = null;

export async function openOracle () {
    if (!existsSync(page_.replace('oracle.html', 'oracle.bundle.js'))) throw new Error('run: node test/browser/build.mjs');
    browser = await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
    });
    return browser;
}

export async function runRenderedVm (bytes, trace, seed = 1, { withSize = false } = {}) {
    if (!browser) await openOracle();
    if (page) await page.close();
    page = await browser.newPage();
    await page.goto(pathToFileURL(page_).href);
    const b64 = Buffer.from(bytes).toString('base64');
    return page.evaluate(([b, t, s, w]) => window.ORACLE.run(b, t, s, w), [b64, trace, seed, withSize]);
}

export async function closeOracle () { if (browser) await browser.close(); browser = page = null; }
