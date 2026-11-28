// Game export (bwgame-v1): SB3 graph -> editable JavaScript / Python+pygame games.
//
// The central check is differential: a gallery program is built from pseudocode,
// saved as .sb3, then run (a) in the real scratch-vm and (b) as the exported
// JavaScript game on the bwgame runtime, through the same input trace. Every
// sampled frame must agree on positions, directions, costumes, visibility,
// variables, lists and speech bubbles (see test/helpers/game-differential.mjs for
// the pinned scheduling and why size is not compared headless).
//
// Programs whose behaviour depends on collisions are excluded from that check,
// because headless scratch-vm has no renderer and reports no collisions; they
// are covered by the JS <-> Python parity check instead.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';
import { buildGameModel, classify, svgContentBounds } from '../src/game/model.js';
import { emitGame } from '../src/game/emit.js';
import { exportGame, loadSb3 } from '../src/game/export.js';
import { rasterizeWithChromium, decodeRaster } from '../src/game/raster.js';
import { loadJsGame, runVm, runJs } from './helpers/game-differential.mjs';
import { render as renderSources } from '../scripts/gen-game-runtime-sources.mjs';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const origWarn = console.warn;
console.warn = () => {};

async function build (name) {
    const c = new SB3Creator();
    c.parse(examples[name]);
    const bytes = new Uint8Array(await (await c.generateSB3()).arrayBuffer());
    return { bytes, input: await loadSb3(bytes) };
}

function keyTrace (keys, frames = 300) {
    const events = [{ frame: 0, type: 'flag' }];
    keys.forEach((k, i) => events.push({ frame: 20 + (i * 15), type: 'keydown', key: k }, { frame: 22 + (i * 15), type: 'keyup', key: k }));
    return { frames, events, sample: Array.from({ length: frames / 10 }, (_, i) => (i + 1) * 10) };
}

test('runtime sources embedded for the browser exporter are current', () => {
    const file = path.join(ROOT, 'src', 'game', 'runtime', 'sources.generated.js');
    assert.equal(readFileSync(file, 'utf8'), renderSources(), 'run: node scripts/gen-game-runtime-sources.mjs');
});

test('capability classes: exact, approximate and unsupported opcodes', () => {
    assert.equal(classify('motion_gotoxy').level, 'exact');
    assert.equal(classify('sensing_touchingobject').level, 'approximate');
    assert.equal(classify('sensing_touchingcolor').level, 'unsupported');
    assert.equal(classify('videoSensing_videoOn').level, 'unsupported');
});

test('svg content bounds follow what the costume draws, and refuse what they cannot bound', () => {
    const sq = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><rect x="2" y="2" width="18" height="18" stroke="#000" stroke-width="2"/></svg>';
    assert.deepEqual(svgContentBounds(sq), [1, 1, 21, 21]);
    assert.deepEqual(svgContentBounds('<svg><circle cx="10" cy="10" r="8"/></svg>'), [2, 2, 18, 18]);
    assert.equal(svgContentBounds('<svg><g transform="scale(2)"><rect width="1" height="1"/></g></svg>'), null);
    assert.equal(svgContentBounds('<svg><path d="m 1 2 l 5 9"/></svg>'), null);
});

test('export refuses unsupported blocks and names them', async () => {
    const { input } = await build('snake');
    const project = JSON.parse(JSON.stringify(input.project));
    const apple = project.targets.find(t => t.name === 'Apple');
    apple.blocks.zzCOLOR = { opcode: 'sensing_touchingcolor', next: null, parent: null, inputs: { COLOR: [1, [9, '#ff0000']] }, fields: {}, shadow: false, topLevel: false };
    const hat = Object.values(apple.blocks).find(b => b.opcode === 'event_whenflagclicked');
    let last = hat;
    while (last.next) last = apple.blocks[last.next];
    apple.blocks.zzIF = { opcode: 'control_if', next: null, parent: null, inputs: { CONDITION: [2, 'zzCOLOR'] }, fields: {}, shadow: false, topLevel: false };
    last.next = 'zzIF';
    const r = await exportGame({ project, files: input.files }, { target: 'web' });
    assert.equal(r.ok, false);
    assert.deepEqual(r.reasons, ['Apple: sensing_touchingcolor']);
    const forced = await exportGame({ project, files: input.files }, { target: 'web', allowUnsupported: true });
    assert.equal(forced.ok, true);
    // Forced output keeps the block as a runtime call; without costume rasters it reads false.
    assert.match(forced.files['game.js'], /touchingColor\("#ff0000"\)/);
});

// ------------------------------------------------------------------ scratch-vm differential

const DIFFERENTIAL = {
    g2048: ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'],
    tetris: ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'space', 'ArrowLeft', 'ArrowLeft'],
    sokoban: ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'ArrowUp'],
    maze: ['ArrowUp', 'ArrowLeft', 'ArrowDown'],
    flappy: ['space', 'space', 'space', 'space'],
    art: ['space'],
    control: [], physics: [], animation: [], operators: [], motion: [], looks: [], sensing: [],
    minesweeper: [], tictactoe: [], tictactoe_ai: [], connect4: []
};

for (const [name, keys] of Object.entries(DIFFERENTIAL)) {
    test(`differential: ${name} runs identically in scratch-vm and as an exported JS game`, async () => {
        const { bytes, input } = await build(name);
        const trace = keyTrace(keys);
        const vmOut = await runVm(bytes, trace, 5);
        const { game, dir } = await loadJsGame(input, 5);
        const jsOut = runJs(game, trace);
        rmSync(dir, { recursive: true, force: true });
        assert.equal(jsOut.length, vmOut.length);
        for (let i = 0; i < vmOut.length; i++) assert.deepEqual(jsOut[i], vmOut[i], `${name}: first difference at frame ${vmOut[i].frame}`);
    });
}

// ------------------------------------------------------------------ JS <-> Python parity

const PYTHON = (() => { for (const c of ['python', 'python3']) { try { execFileSync(c, ['-c', 'import sys; assert sys.version_info >= (3, 8)'], { stdio: 'ignore' }); return c; } catch { /* next */ } } return null; })();
const TRACES = path.join(ROOT, 'test', 'fixtures', 'game-traces');

// Each fixture trace drives keys, mouse clicks and typed answers through one
// gallery game. The exported Python (bwgame.py, headless, no pygame needed) must
// print exactly the JSON the exported JavaScript produces for the same trace.
for (const name of ['snake', 'snake_pro', 'breakout', 'invaders', 'pong_ai', 'bomberman', 'tetris', 'connect4', 'game', 'flappy', 'g2048', 'sokoban', 'maze', 'minesweeper', 'tictactoe_ai', 'art', 'animation', 'physics']) {
    test(`parity: ${name} exported to JavaScript and to Python produces identical state traces`, { skip: !PYTHON && 'no python' }, async () => {
        const { input } = await build(name);
        const trace = JSON.parse(readFileSync(path.join(TRACES, `${name}.json`), 'utf8'));
        const { game, dir } = await loadJsGame(input, trace.seed ?? 1);
        try {
            const js = JSON.stringify(game.runTrace(trace));
            const r = await exportGame(input, { target: 'pygame', title: name });
            for (const f of ['game.py', 'bwgame.py', 'manifest.json']) writeFileSync(path.join(dir, f), r.files[f]);
            writeFileSync(path.join(dir, 'trace.json'), JSON.stringify(trace));
            const py = execFileSync(PYTHON, [path.join(dir, 'bwgame.py'), 'trace', dir, path.join(dir, 'trace.json')],
                { maxBuffer: 64 << 20, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } }).toString().trim();
            if (py !== js) {
                const a = JSON.parse(js), b = JSON.parse(py);
                const i = a.findIndex((x, k) => JSON.stringify(x) !== JSON.stringify(b[k]));
                assert.deepEqual(b[i], a[i], `${name}: first difference at sample ${i}`);
            }
            assert.equal(py, js);
        } finally { rmSync(dir, { recursive: true, force: true }); }
    });
}

// Broadcast loops: a script that broadcasts to another which broadcasts back (or a
// script that re-broadcasts its own message) runs once per frame in scratch-vm, because
// a restarted thread takes its old slot in the thread list. It must neither hang nor
// lose the restart.
test('broadcast ping-pong and self re-broadcast run once per frame, as in scratch-vm', async () => {
    const c = new SB3Creator();
    c.parse(`GLOBAL pings
GLOBAL pongs
GLOBAL selfs

SPRITE A:
  SHAPE circle 10
  WHEN flag clicked:
    set pings to 0
    set selfs to 0
    broadcast ping
    broadcast again
  WHEN I receive ping:
    change pings by 1
    broadcast pong
  WHEN I receive again:
    change selfs by 1
    broadcast again

SPRITE B:
  SHAPE circle 10
  WHEN flag clicked:
    set pongs to 0
  WHEN I receive pong:
    change pongs by 1
    broadcast ping
`);
    const bytes = new Uint8Array(await (await c.generateSB3()).arrayBuffer());
    const input = await loadSb3(bytes);
    const trace = { frames: 12, sample: [3, 6, 9, 12], events: [{ frame: 0, type: 'flag' }] };
    const { game } = await loadJsGame(input, 1);
    const js = runJs(game, trace);
    const vm = await runVm(bytes, trace, 1);
    assert.deepEqual(js, vm);
    assert.ok(js.at(-1).vars.pings > 3 && js.at(-1).vars.selfs > 3, JSON.stringify(js.at(-1).vars));
});

// A warped ("run without screen refresh") loop that never ends must not freeze the
// game: like scratch-vm (Sequencer.WARP_TIME), the runtime gives the frame up and the
// other scripts keep running. Deterministic mode uses the same iteration budget in
// both targets, so the traces match exactly.
test('an endless warped loop yields the frame instead of hanging, identically in JS and Python', { skip: !PYTHON && 'no python' }, async () => {
    const c = new SB3Creator();
    c.parse(`GLOBAL spins
GLOBAL ticks

SPRITE Spinner:
  SHAPE circle 20
  DEFINE FAST spin:
    FOREVER:
      change spins by 1
  WHEN flag clicked:
    set spins to 0
    spin
  WHEN flag clicked:
    set ticks to 0
    FOREVER:
      change ticks by 1
`);
    const input = await loadSb3(new Uint8Array(await (await c.generateSB3()).arrayBuffer()));
    const trace = { frames: 6, sample: [2, 4, 6], events: [{ frame: 0, type: 'flag' }] };
    const { game, dir } = await loadJsGame(input, 1);
    try {
        const states = game.runTrace(trace);
        const ticks = states.map(s => s.vars.ticks), spins = states.map(s => s.vars.spins);
        assert.ok(ticks[2] > ticks[0] && ticks[0] > 0, `the other script keeps running: ${ticks}`);
        assert.ok(spins[0] > 0 && spins[2] > spins[1] && spins[1] > spins[0], `the warped loop runs on in budgets: ${spins}`);
        const r = await exportGame(input, { target: 'pygame', title: 'warp' });
        for (const f of ['game.py', 'bwgame.py', 'manifest.json']) writeFileSync(path.join(dir, f), r.files[f]);
        writeFileSync(path.join(dir, 'trace.json'), JSON.stringify(trace));
        const py = execFileSync(PYTHON, [path.join(dir, 'bwgame.py'), 'trace', dir, path.join(dir, 'trace.json')],
            { maxBuffer: 64 << 20, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } }).toString().trim();
        assert.equal(py, JSON.stringify(states));
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

// The same parity with costume rasters (pixel touching, clicks, tight bounds, touching
// colour): both targets come from ONE rasterization, so manifest and rasters are identical,
// and the Python runtime reads the exported .bwr files itself. Needs headless Chromium
// (PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH or playwright's own); skipped without one.
const CHROMIUM = PYTHON ? (await rasterizeWithChromium([])) !== null : false;
for (const name of ['snake', 'breakout', 'invaders', 'pong_ai', 'bomberman', 'connect4', 'game', 'minesweeper', 'tictactoe_ai', 'tetris']) {
    test(`parity: ${name} with costume rasters runs identically in JavaScript and Python`, { skip: (!PYTHON && 'no python') || (!CHROMIUM && 'no Chromium for rasters') }, async () => {
        const { input } = await build(name);
        const trace = JSON.parse(readFileSync(path.join(TRACES, `${name}.json`), 'utf8'));
        let once = null;
        const rasterize = async jobs => once || (once = await rasterizeWithChromium(jobs));
        const web = await exportGame(input, { target: 'web', title: name, rasterize });
        const pyx = await exportGame(input, { target: 'pygame', title: name, rasterize });
        assert.equal(pyx.files['manifest.json'], web.files['manifest.json']);
        const rasterPaths = Object.keys(pyx.files).filter(p => p.startsWith('assets/raster/'));
        assert.ok(rasterPaths.length > 0, 'the pygame export carries the costume rasters');
        const dir = mkdtempSync(path.join(tmpdir(), 'bwgame-r-'));
        try {
            for (const f of ['bwgame.js', 'game.js']) writeFileSync(path.join(dir, f), web.files[f]);
            for (const f of ['game.py', 'bwgame.py', 'manifest.json', ...rasterPaths]) {
                mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
                writeFileSync(path.join(dir, f), pyx.files[f]);
            }
            const manifest = JSON.parse(web.files['manifest.json']);
            const rasters = {};
            for (const p of rasterPaths) rasters[p] = await decodeRaster(web.files[p]);
            const { Game: G } = await import(pathToFileURL(path.join(dir, 'bwgame.js')).href);
            const { default: setup } = await import(pathToFileURL(path.join(dir, 'game.js')).href);
            const game = new G(manifest, { seed: trace.seed ?? 1, rasters });
            setup(game);
            const js = JSON.stringify(game.runTrace(trace));
            writeFileSync(path.join(dir, 'trace.json'), JSON.stringify(trace));
            const py = execFileSync(PYTHON, [path.join(dir, 'bwgame.py'), 'trace', dir, path.join(dir, 'trace.json')],
                { maxBuffer: 64 << 20, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } }).toString().trim();
            if (py !== js) {
                const a = JSON.parse(js), b = JSON.parse(py);
                const i = a.findIndex((x, k) => JSON.stringify(x) !== JSON.stringify(b[k]));
                assert.deepEqual(b[i], a[i], `${name}: first difference at sample ${i}`);
            }
            assert.equal(py, js);
        } finally { rmSync(dir, { recursive: true, force: true }); }
    });
}

// ------------------------------------------------------------------ languages -> the same game

// The workshop's language chain: a program written (or generated) as Python or
// JavaScript reads back into blocks, and must export the very same game as the
// pseudocode it came from.
for (const name of ['breakout', 'snake_pro', 'tetris', 'invaders']) {
    test(`languages: ${name} as pseudocode, Python and JavaScript exports one identical game`, async () => {
        const gameOf = async (pseudocode) => {
            const c = new SB3Creator();
            c.parse(pseudocode);
            const input = await loadSb3(new Uint8Array(await (await c.generateSB3()).arrayBuffer()));
            const { manifest, code } = buildGameModel(input.project, input.files);
            return emitGame({ manifest, code }, 'js');
        };
        const base = new SB3Creator();
        base.parse(examples[name]);
        const viaPy = pythonToPseudocode(base.generatePython(undefined, {}));
        const viaJs = javascriptToPseudocode(base.generateJavaScript(undefined, {}));
        const direct = await gameOf(examples[name]);
        assert.equal(await gameOf(viaPy.pseudocode), direct, 'Python -> blocks -> game');
        assert.equal(await gameOf(viaJs.pseudocode), direct, 'JavaScript -> blocks -> game');
    });
}

// ------------------------------------------------------------------ exported packages

test('web export: editable modules, a self-contained play.html, manifest and report', async () => {
    const { input } = await build('breakout');
    const r = await exportGame(input, { target: 'web', title: 'Breakout' });
    assert.equal(r.ok, true);
    for (const f of ['index.html', 'play.html', 'game.js', 'bwgame.js', 'bwgame-web.js', 'manifest.json', 'export-report.json', 'README.md']) {
        assert.ok(r.files[f], `missing ${f}`);
    }
    const manifest = JSON.parse(r.files['manifest.json']);
    for (const t of [manifest.stage, ...manifest.sprites]) {
        for (const c of t.costumes) assert.ok(r.files[c.file], `asset ${c.file} packaged`);
    }
    const play = r.files['play.html'];
    assert.doesNotMatch(play, /\bimport\s*\{|export default|src="http|fetch\(\s*['"`]https?:/, 'play.html needs no modules, network or server');
    assert.match(play, /data:image\/svg\+xml;base64,/);
    const report = JSON.parse(r.files['export-report.json']);
    assert.equal(report.contract, 'bwgame-export-v1');
    assert.equal(report.target, 'web');
    assert.deepEqual(report.capability.unsupported, []);
    assert.ok(report.capability.approximate.sensing_touchingobject, 'collision is reported as approximate');
});

test('every gallery game exports, and its JS and Python are syntactically valid', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bwgame-syntax-'));
    const py = (() => { for (const c of ['python', 'python3']) { try { execFileSync(c, ['--version'], { stdio: 'ignore' }); return c; } catch { /* next */ } } return null; })();
    try {
        for (const name of ['snake', 'snake_pro', 'breakout', 'bomberman', 'tetris', 'pong_2p', 'pong_ai', 'sokoban', 'invaders', 'flappy', 'tictactoe_ai', 'g2048', 'maze', 'connect4', 'minesweeper', 'game', 'art']) {
            const { input } = await build(name);
            const { manifest, code, report } = buildGameModel(input.project, input.files);
            assert.deepEqual(report.unsupported, [], `${name} needs no unsupported block`);
            const js = emitGame({ manifest, code }, 'js');
            const jsFile = path.join(dir, `${name}.mjs`);
            writeFileSync(jsFile, js.replace(/^import .*$/m, ''));
            execFileSync(process.execPath, ['--check', jsFile]);
            if (py) {
                const pyFile = path.join(dir, `${name}.py`);
                writeFileSync(pyFile, emitGame({ manifest, code }, 'py'));
                execFileSync(py, ['-m', 'py_compile', pyFile]);
            }
        }
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('bw export-game: pseudocode file to a web game and a pygame project', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'bwgame-cli-'));
    try {
        const src = path.join(dir, 'snake.bw');
        writeFileSync(src, examples.snake);
        execFileSync(process.execPath, [path.join(ROOT, 'bin', 'bw.mjs'), 'export-game', src, '--to', 'web', '-o', path.join(dir, 'web')], { stdio: 'pipe' });
        execFileSync(process.execPath, [path.join(ROOT, 'bin', 'bw.mjs'), 'export-game', src, '--to', 'pygame', '-o', path.join(dir, 'py')], { stdio: 'pipe' });
        for (const f of ['web/play.html', 'web/game.js', 'py/main.py', 'py/game.py', 'py/bwgame.py', 'py/requirements.txt']) {
            assert.ok(existsSync(path.join(dir, f)), `missing ${f}`);
        }
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

test.after(() => { console.warn = origWarn; });
