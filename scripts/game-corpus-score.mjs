#!/usr/bin/env node
// Score a directory of .sb3 projects against the bwgame-v1 game export.
//
//   node scripts/game-corpus-score.mjs <dir>... [--frames 300] [--json out.json]
//
// Per project:
//   export   : ok | refused (with the unsupported opcodes) | error
//   run      : the exported JS game runs headless for N frames under a fixed input
//              trace (green flag, arrow keys, space, clicks): crash or not, how many
//              sprites/variables changed (liveness)
//   vm       : the same trace in vanilla scratch-vm (one tick per frame, frame clock,
//              shared seeded random); the first sampled frame where state differs.
//              Headless scratch-vm cannot see collisions, edges or hover, so a
//              divergence there is a lead, not a verdict. With --render the reference is
//              scratch-vm WITH the real WebGL renderer in headless Chromium
//              (test/browser/oracle.entry.js; build it with node test/browser/build.mjs).
// No project data is written anywhere except the optional JSON report.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadSb3, exportGame } from '../src/game/export.js';
import { loadJsGame, runVm, runJs } from '../test/helpers/game-differential.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); if (i < 0) return dflt; const v = args[i + 1]; args.splice(i, 2); return v; };
const FRAMES = Number(opt('--frames', 300));
const OUT = opt('--json', null);
const RENDER = args.includes('--render'); if (RENDER) args.splice(args.indexOf('--render'), 1);
const oracle = RENDER ? await import('../test/helpers/render-oracle.mjs') : null;
const files = args.flatMap(d => statSync(d).isDirectory()
    ? readdirSync(d).filter(f => f.endsWith('.sb3')).sort().map(f => path.join(d, f)) : [d]);

const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'space'];
const trace = { frames: FRAMES, sample: Array.from({ length: FRAMES / 10 }, (_, i) => (i + 1) * 10), events: [{ frame: 0, type: 'flag' }] };
for (let f = 30, i = 0; f < FRAMES - 10; f += 25, i++) {
    const k = keys[i % keys.length];
    trace.events.push({ frame: f, type: 'keydown', key: k }, { frame: f + 8, type: 'keyup', key: k });
    if (i % 3 === 0) trace.events.push({ frame: f + 4, type: 'mousedown', x: 0, y: 0 }, { frame: f + 5, type: 'mouseup' });
}

const log = console.warn; console.warn = () => {};
const rows = [];
for (const file of files) {
    const row = { file: path.basename(file) };
    try {
        const bytes = readFileSync(file);
        const input = await loadSb3(bytes);
        const r = await exportGame(input, { target: 'web', title: row.file });
        row.approximate = Object.keys(r.report.approximate);
        if (!r.ok) {
            row.export = 'refused';
            row.unsupported = [...new Set(r.report.unsupported.map(u => u.opcode))];
        } else {
            row.export = 'ok';
            const { game } = await loadJsGame(input, 5);
            let js;
            try { js = runJs(game, trace); row.run = 'ok'; } catch (e) { row.run = 'crash'; row.error = String(e.message).slice(0, 160); }
            if (js) {
                const first = js[0], last = js[js.length - 1];
                row.liveness = {
                    spritesChanged: last.sprites.filter(s => { const a = first.sprites.find(x => x.name === s.name && !x.clone); return a && (a.x !== s.x || a.y !== s.y || a.costume !== s.costume || a.visible !== s.visible); }).length,
                    clones: last.sprites.filter(s => s.clone).length,
                    varsChanged: Object.keys(last.vars).filter(k => JSON.stringify(last.vars[k]) !== JSON.stringify(first.vars[k])).length
                };
                try {
                    const vm = RENDER ? await oracle.runRenderedVm(bytes, trace, 5) : await runVm(bytes, trace, 5);
                    const i = vm.findIndex((v, k) => JSON.stringify(v) !== JSON.stringify(js[k]));
                    row.vmFirstDivergence = i < 0 ? null : vm[i].frame;
                } catch (e) { row.vm = `vm error: ${String(e.message).slice(0, 100)}`; }
            }
        }
    } catch (e) { row.export = 'error'; row.error = String(e.message).slice(0, 160); }
    rows.push(row);
    log(`${row.export.padEnd(8)} ${(row.run || '').padEnd(6)} ${row.file.padEnd(26)} ${row.unsupported ? 'needs ' + row.unsupported.join(',') :
        row.vmFirstDivergence === null ? 'vm: identical' : row.vmFirstDivergence ? `vm: diverges @${row.vmFirstDivergence}` : (row.vm || row.error || '')}`);
}
const n = rows.length, ok = rows.filter(r => r.export === 'ok');
const summary = {
    projects: n, exportable: ok.length, refused: rows.filter(r => r.export === 'refused').length, errors: rows.filter(r => r.export === 'error').length,
    crashes: ok.filter(r => r.run === 'crash').length, vmIdentical: ok.filter(r => r.vmFirstDivergence === null).length,
    refusalOpcodes: Object.entries(rows.flatMap(r => r.unsupported || []).reduce((m, o) => ({ ...m, [o]: (m[o] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])
};
log(JSON.stringify(summary, null, 1));
if (OUT) writeFileSync(OUT, JSON.stringify({ trace: { frames: FRAMES }, reference: RENDER ? 'scratch-vm + scratch-render' : 'headless scratch-vm', summary, rows }, null, 1));
if (oracle) await oracle.closeOracle();
