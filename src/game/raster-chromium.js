// Node-only: the CLI's costume rasterizer. It runs raster.js's rasterizeInPage in
// headless Chromium. Kept out of raster.js because browser builds vendor that
// module and must not bundle Playwright.
import { rasterizeInPage } from './raster.js';

// The same rasterizeInPage, in headless Chromium (the shared
// browser from PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH when set). Returns null when no
// browser is available, so the export falls back to box geometry.
export async function rasterizeWithChromium (jobs) {
    let chromium;
    try { ({ chromium } = await import('playwright')); } catch { return null; }
    let browser;
    try {
        browser = await chromium.launch({ executablePath: globalThis.process?.env?.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
    } catch { return null; }
    try {
        const page = await browser.newPage();
        await page.setContent('<!doctype html><title>raster</title>');
        return await page.evaluate(`(${rasterizeInPage.toString()})(${JSON.stringify(jobs)})`);
    } finally { await browser.close(); }
}
