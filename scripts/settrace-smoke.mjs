#!/usr/bin/env node
// Smoke test for the settrace debug FIRMWARE against the {trace:true}
// codegen. Drives the real micro:bit sim (simulator.html, iframe message
// protocol) headlessly, with the wasm fetch rerouted to the settrace
// build, and verdicts the three firmware-behavior questions the codegen
// flagged: (a) tracer recursion, (b) generator-frame line events,
// (c) f_locals population at a halt.
//
//   node scripts/settrace-smoke.mjs --sim-dir <path-to-microbit-sim> \
//        [--wasm <path-to-settrace-firmware.wasm>]
//
// --wasm defaults to <sim-dir>/build-debug/firmware.wasm.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import SB3Creator from '../src/utils/sb3Creator.js';

const argv = process.argv.slice(2);
const arg = (k, dflt) => { const i = argv.indexOf(k); return i !== -1 ? argv[i + 1] : dflt; };
const SIM_DIR = arg('--sim-dir');
if (!SIM_DIR) { console.error('need --sim-dir'); process.exit(2); }
const WASM = arg('--wasm', join(SIM_DIR, 'build-debug', 'firmware.wasm'));
// The glue is emsdk-version-locked to the wasm (emscripten_memcpy_big was
// renamed across versions): a settrace wasm under the STOCK glue dies with a
// LinkError. Default to a firmware.js beside the wasm.
const GLUE = arg('--glue', WASM.replace(/\.wasm$/, '.js'));
const PORT = Number(arg('--port', 3179));

// playwright rides along from the sibling UI repo — sb3-creator itself
// has no browser dependency and should not grow one for a smoke script.
const requireUI = createRequire(new URL('../../bw-circuit-ui/package.json', import.meta.url));
const { chromium } = requireUI('playwright');

const SRC = `DEVICE MICROBIT:
  PIN led1 = P0 OUTPUT

  DEFINE bump (n):
    change count by n
    turn on led1

  WHEN started:
    set count to 0
    FOREVER:
      bump 1
      wait 100 ms
`;

const c = new SB3Creator();
c.parse(SRC);
const probe = c.generateMicroPython(c.project, { trace: true });
if (!probe.ok) { console.error('codegen failed', probe.reasons); process.exit(1); }
const pyLines = probe.py.split('\n');
// break on the DEFINE's first line — a true generator frame reached by
// `yield from`, with a real LOCAL (the parameter n) in scope.
const bpLine = Object.keys(probe.lineMap).find((k) => pyLines[k - 1].trim() === 'count = count + n');
if (!bpLine) { console.error('DEFINE body line not in lineMap'); process.exit(1); }
const bpBlock = probe.lineMap[bpLine];
const traced = c.generateMicroPython(c.project, { trace: true, breakpoints: [bpBlock] });

const RS = '\x1e';
const L_RE = new RegExp(RS + 'L(\\d+)', 'g');
const fail = (m) => { console.error(`FAIL ${m}`); process.exitCode = 1; };
const pass = (m) => console.log(`PASS ${m}`);
const verdict = (k, v) => console.log(`VERDICT (${k}): ${v}`);

// ---- host page: same-origin wrapper that flashes and relays serial ----
const HOST = `<!DOCTYPE html><html><body>
<script>
window.__serial = '';
window.__errs = [];
window.__flashed = false;
const frame = document.createElement('iframe');
frame.src = 'simulator.html';
frame.style.width = '400px'; frame.style.height = '300px';
document.body.appendChild(frame);
function flash() {
  if (window.__flashed || !window.__mainpy) return;
  window.__flashed = true;
  frame.contentWindow.postMessage({ kind: 'flash',
    filesystem: { 'main.py': new Uint8Array(window.__mainpy) } }, '*');
}
// Flash ONLY on request_flash (the play click): flashing on 'ready' runs
// board.flash before the AudioContext exists and the board start THROWS
// ("Context must be pre-created from a user event") — found the hard way.
window.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.kind === 'serial_output') window.__serial += d.data;
  else if (d.kind === 'ready') { window.__ready = true; }
  else if (d.kind === 'request_flash') flash();
  else if (d.kind === 'internal_error') window.__errs.push(String((d.error && d.error.message) || d.error));
});
window.__flash = flash;
window.__send = (s) => frame.contentWindow.postMessage({ kind: 'serial_input', data: s }, '*');
</${'script'}>
</body></html>`;
const hostPath = join(SIM_DIR, '__settrace-smoke-host.html');
writeFileSync(hostPath, HOST);

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
    { cwd: SIM_DIR, stdio: 'ignore' });
const cleanup = () => { try { server.kill(); } catch { /* gone */ } try { rmSync(hostPath); } catch { /* gone */ } };
process.on('exit', cleanup);
// wait until the server actually answers — a spawn that died (port in use,
// interpreter hiccup) otherwise surfaces as an opaque navigation timeout.
{
    let up = false;
    for (let i = 0; i < 40 && !up; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/simulator.html`);
            up = res.ok;
        } catch { await new Promise((r) => setTimeout(r, 250)); }
    }
    if (!up) { console.error('static server did not come up'); process.exit(1); }
}

const wasmBytes = readFileSync(WASM);
const glueBytes = readFileSync(GLUE);
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

async function run(py, { input = null, holdMs = 4000 } = {}) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => fail('page error: ' + e));
    await page.route('**/build/firmware.wasm', (route) =>
        route.fulfill({ body: wasmBytes, contentType: 'application/wasm' }));
    await page.route('**/build/firmware.js', (route) =>
        route.fulfill({ body: glueBytes, contentType: 'text/javascript' }));
    await page.goto(`http://127.0.0.1:${PORT}/__settrace-smoke-host.html`);
    await page.evaluate((bytes) => { window.__mainpy = bytes; window.__flashed = false; },
        Array.from(new TextEncoder().encode(py)));
    await page.waitForFunction(() => window.__ready, { timeout: 15000 });
    // the play overlay creates the AudioContext and posts request_flash;
    // a JS click works under --autoplay-policy=no-user-gesture-required.
    await page.evaluate(() => {
        const doc = document.querySelector('iframe').contentDocument;
        const b = doc && doc.querySelector('.play-button');
        if (b) b.click();
    });
    if (input) {
        // wait for the halt dump, then resume
        await page.waitForFunction((rs) => window.__serial.includes(rs + 'V'), RS, { timeout: 15000 })
            .catch(() => fail('no halt dump within 15s'));
        await page.evaluate((s) => window.__send(s), input);
    }
    await page.waitForTimeout(holdMs);
    const out = await page.evaluate(() => ({ serial: window.__serial, errs: window.__errs, ready: !!window.__ready }));
    await page.close();
    return out;
}

// ---- phase 1: free-running trace build ------------------------------------
{
    const r = await run(probe.py);
    if (!r.ready) fail('sim never posted ready');
    const Ls = [...r.serial.matchAll(L_RE)].map((m) => m[1]);
    if (!Ls.length) {
        fail(`no L events at all — serial: ${JSON.stringify(r.serial.slice(0, 300))}`);
        verdict('a-tracer-recursion', 'INCONCLUSIVE — no line events (settrace inactive or crashed)');
        verdict('b-generator-frames', 'INCONCLUSIVE');
    } else {
        pass(`line events stream: ${Ls.length} events, ${new Set(Ls).size} distinct lines`);
        const unmapped = [...new Set(Ls)].filter((n) => !probe.lineMap[n]);
        unmapped.length === 0
            ? pass('every reported line is in lineMap')
            : fail(`lines outside lineMap: ${unmapped.join(', ')}`);
        // (b): DEFINE body lines arrive from a generator frame entered via
        // `yield from`, task lines from the task generator itself.
        const defLines = Object.keys(probe.lineMap).filter((n) =>
            /count = count \+ n|pin0\.write_digital\(1\)/.test(pyLines[n - 1]));
        const sawDefine = defLines.some((n) => Ls.includes(n));
        verdict('b-generator-frames', sawDefine
            ? 'PASS — line events fire inside the DEFINE generator (yield from) and the task generator'
            : `FAIL — no events from DEFINE body lines ${defLines.join(',')}; saw ${[...new Set(Ls)].join(',')}`);
        // (a): recursion would hang or explode; a bounded, repeating,
        // loop-shaped stream with no internal errors is the healthy signature.
        const errs = r.errs.length ? ` internal errors: ${r.errs.join(' | ')}` : '';
        verdict('a-tracer-recursion', (r.errs.length === 0)
            ? 'PASS — bounded stream, no internal errors (the firmware does not trace _bw_tr itself)'
            : `SUSPECT —${errs}`);
    }
}

// ---- phase 2: breakpoint halt + resume ------------------------------------
{
    const r = await run(traced.py, { input: RS + 'c\r', holdMs: 5000 });
    const halted = r.serial.includes(`${RS}L${bpLine}`);
    halted ? pass(`breakpoint line ${bpLine} reported`) : fail(`no L${bpLine} in stream`);
    const vDump = r.serial.match(new RegExp(RS + 'V(\\{.*?\\})\\r?\\n'));
    const kDump = r.serial.match(new RegExp(RS + 'K(\\[.*?\\])\\r?\\n'));
    if (!vDump) fail('no V dump at halt — serial tail: ' + JSON.stringify(r.serial.slice(-200)));
    if (!kDump) fail('no K dump at halt');
    if (vDump) {
        let v = {};
        try { v = JSON.parse(vDump[1]); } catch { fail('V payload is not JSON: ' + vDump[1]); }
        'count' in v ? pass(`globals overlay carries the variable pane (count=${v.count})`)
            : fail(`no count in V dump: ${vDump[1]}`);
        verdict('c-f_locals', 'n' in v
            ? `PASS — f_locals populated (DEFINE parameter n=${v.n} visible at the halt)`
            : 'PARTIAL — f_locals empty on this firmware; the globals overlay still carries the pane');
    }
    if (kDump) {
        let k = [];
        try { k = JSON.parse(kDump[1]); } catch { fail('K payload not JSON'); }
        k.length >= 2 ? pass(`call stack ${JSON.stringify(k)} (depth ${k.length})`)
            : fail(`stack too shallow: ${JSON.stringify(k)}`);
    }
    if (vDump) {
        const after = r.serial.slice(r.serial.indexOf(vDump[0]) + vDump[0].length);
        L_RE.lastIndex = 0;
        L_RE.test(after) ? pass('resumed after continue — line events keep coming')
            : fail('no line events after resume');
    }
}

await browser.close();
cleanup();
console.log(process.exitCode ? 'SMOKE: FAIL' : 'SMOKE: PASS');
