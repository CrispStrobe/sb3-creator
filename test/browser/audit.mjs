// Visual audit — the missing half of our test suite. The node --test suites check
// VM *state* (variables/lists/logic) but are blind to *visual* bugs: a sprite that
// renders as a letter-circle, a grid with no tiles, numbers that never show. This
// renders every example in the real WebGL harness, drives a few generic inputs, and
// writes a screenshot per example plus a contact sheet you can eyeball at a glance.
//
//   node test/browser/build.mjs && node test/browser/audit.mjs
//   → test/browser/shots/audit/<name>.png  and  _sheet1.png / _sheet2.png
import {chromium} from 'playwright';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import SB3Creator from '../../src/utils/sb3Creator.js';
import examples from '../../src/utils/examples.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'shots', 'audit');
fs.mkdirSync(out, {recursive: true});

async function sb3 (code) {
    const c = new SB3Creator(); c.parse(code);
    return Buffer.from(await (await c.generateSB3()).arrayBuffer()).toString('base64');
}

const browser = await chromium.launch({headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist']});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message.split('\n')[0]));

const names = Object.keys(examples);
const report = [];
for (const name of names) {
    await page.goto('file://' + path.join(dir, 'harness.html'));
    errors.length = 0;
    let err = '';
    try {
        const b64 = await sb3(examples[name]);
        const r = await page.evaluate(async b => {
            try { return {ok: true, ...(await window.SB3.load(b))}; } catch (e) { return {ok: false, err: String(e && e.stack || e)}; }
        }, b64);
        if (!r.ok) err = 'load: ' + r.err;
        await page.evaluate(() => window.SB3.step(40));
        for (const [k, sk] of [['ArrowRight', 'right arrow'], ['ArrowUp', 'up arrow'], [' ', 'space'], ['w', 'w']]) {
            await page.evaluate(([kk, s]) => window.SB3.pressKey(kk, s), [k, sk]);
            await page.evaluate(() => window.SB3.step(8));
            await page.evaluate(kk => window.SB3.releaseKey(kk), k);
        }
        await page.evaluate(() => { window.SB3.clickAt(120, 130); window.SB3.clickAt(240, 180); window.SB3.clickAt(300, 200); });
        await page.evaluate(() => window.SB3.step(30));
    } catch (e) { err = String(e.message || e); }
    await page.locator('#stage').screenshot({path: path.join(out, `${name}.png`)}).catch(() => {});
    report.push({name, err: err || (errors[0] || '')});
    process.stdout.write(`  ${name}${err ? ' ⚠ ' + err.slice(0, 70) : ''}\n`);
}

// contact sheets
function sheet (list, file) {
    const cells = list.map(f => {
        const b64 = fs.readFileSync(path.join(out, f)).toString('base64');
        return `<div class=c><img src="data:image/png;base64,${b64}"><div class=l>${f.replace('.png', '')}</div></div>`;
    }).join('');
    fs.writeFileSync(path.join(out, file + '.html'), `<body style="margin:0;background:#222"><style>
body{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}
.c{background:#333;border-radius:4px;overflow:hidden}.c img{width:100%;display:block;background:#7ec}
.l{color:#fff;font:13px monospace;text-align:center;padding:4px}</style>${cells}</body>`);
}
const shots = names.map(n => `${n}.png`).filter(f => fs.existsSync(path.join(out, f)));
const mid = Math.ceil(shots.length / 2);
sheet(shots.slice(0, mid), '_sheet1');
sheet(shots.slice(mid), '_sheet2');
for (const s of ['_sheet1', '_sheet2']) {
    await page.goto('file://' + path.join(out, s + '.html'));
    await page.waitForTimeout(400);
    await page.screenshot({path: path.join(out, s + '.png'), fullPage: true});
}
fs.writeFileSync(path.join(out, '_report.json'), JSON.stringify(report, null, 1));
await browser.close();
console.log(`\naudit → ${out} (see _sheet1.png / _sheet2.png)`);
