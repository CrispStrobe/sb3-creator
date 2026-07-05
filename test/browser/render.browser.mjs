// Browser render tests (opt-in: `npm run test:browser`). Loads generated .sb3 files
// into scratch-vm + scratch-render (WebGL) inside headless Chromium via Playwright.
// Unlike the headless-VM suite, the renderer is attached, so touching/collision works.
// Also writes gameplay screenshots to test/browser/shots/.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SB3Creator from '../../src/utils/sb3Creator.js';
import examples from '../../src/utils/examples.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const shots = path.join(dir, 'shots');
fs.mkdirSync(shots, { recursive: true });

let browser, page;
const pageErrors = [];

async function sb3Base64(code) {
    const c = new SB3Creator();
    c.parse(code);
    const blob = await c.generateSB3();
    return Buffer.from(await blob.arrayBuffer()).toString('base64');
}

async function load(code) {
    // Fresh page per load so each project gets its own VM + renderer on a clean canvas.
    await page.goto('file://' + path.join(dir, 'harness.html'));
    pageErrors.length = 0;
    const b64 = await sb3Base64(code);
    const res = await page.evaluate(async (b) => {
        try { return { ok: true, ...(await window.SB3.load(b)) }; }
        catch (e) { return { ok: false, err: String(e && e.stack || e) }; }
    }, b64);
    assert.ok(res.ok, `load failed: ${res.err}`);
    return res;
}
const step = (n) => page.evaluate((k) => window.SB3.step(k), n);
const getVar = (name) => page.evaluate((n) => window.SB3.getVar(n), name);
const touching = (a, b) => page.evaluate(([x, y]) => window.SB3.touching(x, y), [a, b]);

before(async () => {
    if (!fs.existsSync(path.join(dir, 'harness.bundle.js'))) {
        throw new Error('harness.bundle.js missing — run `node test/browser/build.mjs` first');
    }
    browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
    });
    page = await browser.newPage();
    page.on('pageerror', (e) => pageErrors.push(e.message.split('\n')[0]));
    await page.goto('file://' + path.join(dir, 'harness.html'));
    const webgl2 = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
    assert.ok(webgl2, 'headless Chromium must provide WebGL2');
});

after(async () => { if (browser) await browser.close(); });

test('renderer reports collision for overlapping sprites, not for separated ones', async () => {
    await load(`SPRITE A:
  WHEN flag clicked:
    go to x: 0 y: 0
    show
SPRITE B:
  WHEN flag clicked:
    go to x: 0 y: 0
    show`);
    await step(6);
    assert.equal(await touching('A', 'B'), true);

    await load(`SPRITE A:
  WHEN flag clicked:
    go to x: -160 y: 0
    show
SPRITE B:
  WHEN flag clicked:
    go to x: 160 y: 0
    show`);
    await step(6);
    assert.equal(await touching('A', 'B'), false);
});

test('touching-driven game logic fires under the real renderer', async () => {
    // This is the class of behavior the headless-VM suite cannot exercise: a script
    // gated on `touching` only runs when the renderer confirms an overlap.
    await load(`SPRITE Ball:
  WHEN flag clicked:
    set size to 40
    go to x: 0 y: 0
    show
SPRITE Brick:
  WHEN flag clicked:
    set size to 40
    go to x: 0 y: 0
    show
  WHEN flag clicked:
    FOREVER:
      IF touching Ball THEN:
        change score by 1
      wait 0.05 seconds`);
    await step(20);
    assert.ok(Number(await getVar('score')) > 0, 'score should increment while overlapping');
});

test('tic-tac-toe renders X + AI\'s O after a click', async () => {
    await load(examples.tictactoe_ai);
    await step(6);
    // Click the top-left cell: player plays X, the AI replies with an O.
    for (const [sx, sy] of [[-80, 80]]) {
        await page.evaluate(([x, y]) => window.SB3.clickAt(x, y, true), [sx, sy]);
        await step(30);
        await page.evaluate(() => window.SB3.clickAt(0, 0, false));
        await step(6);
    }
    await page.screenshot({ path: path.join(shots, 'tictactoe_ai.png'), clip: { x: 0, y: 0, width: 480, height: 360 } });
    const board = await page.evaluate(() => window.SB3.getVar('board'));
    assert.equal(board.filter((v) => String(v) === '1').length, 1);
    assert.equal(board.filter((v) => String(v) === '2').length, 1);
    assert.deepEqual(pageErrors, []);
});

// Render each headline game and screenshot it; assert no runtime page exceptions.
for (const name of ['breakout', 'pong_ai', 'sokoban', 'invaders', 'snake_pro', 'flappy']) {
    test(`game renders without error: ${name}`, async () => {
        await load(examples[name]);
        await step(90); // enough for clone-placement / init loops to populate the stage
        await page.screenshot({ path: path.join(shots, `${name}.png`), clip: { x: 0, y: 0, width: 480, height: 360 } });
        assert.deepEqual(pageErrors, [], `page exceptions in ${name}`);
    });
}
