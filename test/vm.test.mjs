// Live VM tests: run generated projects in the REAL Scratch VM (headless) and
// assert both that every project loads and that feature logic actually executes.
// scratch-vm runs blocks without a renderer, so collision/rendering is inert, but
// variables, lists, custom blocks, clones, and control flow run for real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodeVm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import VM from 'scratch-vm';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';

// Silence the "no storage module" asset warnings for a clean test log.
const origWarn = console.warn;
console.warn = () => {};

// The two CrispStrobe extensions (arrays, planetemaths) are custom (non-builtin), so
// scratch-vm would spin up a browser `Worker` to sandbox them — which doesn't exist in
// headless node. We instead run each extension's real source against a mock `Scratch`
// (the same trick as scripts/gen-runtime-registry.mjs) and register the resulting instance
// as an INTERNAL extension on the main thread, so the project loads and its blocks run.
const REF = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'reference', 'extensions');
const BlockType = { COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'Boolean', HAT: 'hat', EVENT: 'event', CONDITIONAL: 'conditional', LOOP: 'loop', BUTTON: 'button', LABEL: 'label', XML: 'xml' };
const ArgumentType = { NUMBER: 'number', STRING: 'string', BOOLEAN: 'Boolean', ANGLE: 'angle', COLOR: 'color', MATRIX: 'matrix', NOTE: 'note', IMAGE: 'image', COSTUME: 'costume', SOUND: 'sound' };
const Cast = {
    toNumber: (v) => { if (typeof v === 'number') return Number.isNaN(v) ? 0 : v; const n = Number(v); return Number.isNaN(n) ? 0 : n; },
    toString: (v) => String(v),
    toBoolean: (v) => typeof v === 'boolean' ? v : (v === 'true' || (typeof v === 'number' && v !== 0) || (typeof v === 'string' && v !== '' && v !== '0' && v.toLowerCase() !== 'false')),
    compare: (a, b) => { const na = Number(a), nb = Number(b); if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb; const sa = String(a).toLowerCase(), sb = String(b).toLowerCase(); return sa < sb ? -1 : sa > sb ? 1 : 0; },
    toListIndex: (i, len) => { const n = Math.floor(Number(i)); return (n < 1 || n > len) ? 0 : n; }
};
function permissive () {
    const p = new Proxy(function () {}, {
        get: (_, k) => { if (k === Symbol.toPrimitive) return () => ''; if (k === Symbol.toStringTag) return 'Object'; if (k === Symbol.iterator) return function* () {}; if (k === 'valueOf') return () => 0; if (k === 'toString') return () => ''; if (k === 'then') return undefined; return p; },
        has: () => true, apply: () => p, construct: () => p
    });
    return p;
}
function loadLocalExtension (slug) {
    let captured = null;
    const Scratch = {
        BlockType, ArgumentType, Cast, TargetType: { SPRITE: 'sprite', STAGE: 'stage' },
        translate: Object.assign((m) => (m && typeof m === 'object' ? (m.default || '') : m), { setup: () => {} }),
        extensions: { register: (inst) => { captured = inst; }, unsandboxed: true, isPenguinMod: false }
    };
    const known = { Scratch, console: new Proxy({}, { get: () => () => {} }), setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {}, module: { exports: null }, exports: {} };
    const sandbox = new Proxy(known, { has: () => true, get: (t, k) => (k in t ? t[k] : (t[k] = permissive())) });
    nodeVm.createContext(sandbox);
    nodeVm.runInContext(readFileSync(path.join(REF, `${slug}.js`), 'utf8'), sandbox, { timeout: 5000 });
    return captured;
}
// Register CrispStrobe extensions internally instead of via a Worker.
function patchExtensionManager (vm) {
    const em = vm.extensionManager;
    const orig = em.loadExtensionURL.bind(em);
    em.loadExtensionURL = (url) => {
        const slug = ['arrays', 'planetemaths'].find((s) => String(url).includes(s));
        if (slug) {
            const serviceName = em._registerInternalExtension(loadLocalExtension(slug));
            em._loadedExtensions.set(url, serviceName);
            return Promise.resolve();
        }
        return orig(url);
    };
}

async function run(code, frames = 60) {
    const c = new SB3Creator();
    c.parse(code);
    const buf = Buffer.from(await (await c.generateSB3()).arrayBuffer());
    const vm = new VM();
    patchExtensionManager(vm);
    await vm.loadProject(buf);
    vm.start();            // enables the runtime sequencer used by _step()
    vm.greenFlag();
    for (let i = 0; i < frames; i++) vm.runtime._step();
    vm.quit();             // clear the stepping interval so the test process can exit
    return vm;
}

function readVar(vm, name) {
    for (const t of vm.runtime.targets) {
        for (const v of Object.values(t.variables)) {
            if (v.name === name) return v.value;
        }
    }
    return undefined;
}

// Every shipped example must load into the real VM and step without throwing.
for (const [name, code] of Object.entries(examples)) {
    test(`vm: ${name} loads and runs in scratch-vm`, async () => {
        const vm = await run(code, 12);
        assert.ok(vm.runtime.targets.length >= 1);
        assert.ok(vm.runtime.targets.some(t => t.isStage));
    });
}

test('vm: custom block with args accumulates correctly', async () => {
    // add (n) times (k) adds n for i in 0..k inclusive.
    const code = `SPRITE Calc:
  DEFINE add (n) times (k):
    set i to 0
    REPEAT UNTIL i > k:
      change total by n
      change i by 1
  WHEN flag clicked:
    set total to 0
    add 5 times 2
    add 10 times 0
`;
    const vm = await run(code, 80);
    assert.equal(String(readVar(vm, 'total')), '25'); // 5*3 + 10*1
});

test('vm: expression precedence and parentheses evaluate correctly', async () => {
    const code = `SPRITE M:
  WHEN flag clicked:
    set a to 2 + 3 * 4
    set b to (2 + 3) * 4
    set d to 17 mod 5
`;
    const vm = await run(code, 10);
    assert.equal(String(readVar(vm, 'a')), '14');
    assert.equal(String(readVar(vm, 'b')), '20');
    assert.equal(String(readVar(vm, 'd')), '2');
});

test('vm: list operations produce expected contents', async () => {
    const code = `SPRITE L:
  LIST nums
  WHEN flag clicked:
    delete all of nums
    add 3 to nums
    add 7 to nums
    add 9 to nums
    replace item 2 of nums with 100
    delete 1 of nums
    set total to 0
    set i to 1
    REPEAT UNTIL i > length of nums:
      change total by item i of nums
      change i by 1
`;
    const vm = await run(code, 40);
    assert.equal(String(readVar(vm, 'total')), '109'); // [100, 9]
});

test('vm: pick random stays within bounds over many draws', async () => {
    const code = `SPRITE R:
  WHEN flag clicked:
    set bad to 0
    set i to 0
    REPEAT 50:
      set v to pick random 1 to 6
      IF v < 1 or v > 6 THEN:
        change bad by 1
      change i by 1
`;
    const vm = await run(code, 80);
    assert.equal(String(readVar(vm, 'bad')), '0');
});

test('vm: clones are actually created at runtime', async () => {
    const code = `SPRITE Spawner:
  WHEN flag clicked:
    REPEAT 5:
      create clone of myself
  WHEN I start as a clone:
    change count by 1
`;
    const vm = await run(code, 30);
    // 5 clones of the Spawner sprite should now exist
    const spawner = vm.runtime.targets.find(t => !t.isStage && t.sprite.name === 'Spawner');
    const clones = vm.runtime.targets.filter(t => t.sprite === spawner.sprite && !t.isOriginal);
    assert.equal(clones.length, 5);
});

test('vm: sokoban grid init, wall blocking, and box pushing all work', async () => {
    const c = new SB3Creator();
    c.parse(examples.sokoban);
    const buf = Buffer.from(await (await c.generateSB3()).arrayBuffer());
    const vm = new VM();
    await vm.loadProject(buf);
    vm.start();
    vm.greenFlag();
    for (let i = 0; i < 12; i++) vm.runtime._step();
    const val = (n) => {
        for (const t of vm.runtime.targets) for (const x of Object.values(t.variables)) if (x.name === n) return x.value;
    };
    const board = () => val('board');
    const at = (r, col) => board()[r * 8 + col];

    // init: 26 border walls, 2 boxes, player at (3,1)
    assert.equal(board().length, 56);
    assert.equal(board().filter(x => String(x) === '1').length, 26);
    assert.equal(board().filter(x => String(x) === '2').length, 2);

    const press = (key) => {
        vm.runtime.startHats('event_whenkeypressed', { KEY_OPTION: key });
        for (let i = 0; i < 8; i++) vm.runtime._step();
    };
    press('up arrow');                       // (3,1) -> (2,1)
    assert.equal(`${val('prow')},${val('pcol')}`, '2,1');
    press('left arrow');                     // into wall (2,0) -> blocked
    assert.equal(`${val('prow')},${val('pcol')}`, '2,1');
    press('right arrow');                    // (2,1) -> (2,2)
    press('right arrow');                    // push box (2,3) -> (2,4), player -> (2,3)
    assert.equal(`${val('prow')},${val('pcol')}`, '2,3');
    assert.equal(String(at(2, 4)), '2');     // box moved forward
    assert.equal(String(at(2, 3)), '0');     // vacated
    vm.quit();
});

test('vm: pong_ai paddle tracks the ball via sensing_of', async () => {
    const vm = await run(examples.pong_ai, 90);
    // After ~90 frames the AI paddle should have moved from its start (0) toward the ball.
    const ry = vm.runtime.targets
        .flatMap(t => Object.values(t.variables))
        .find(v => v.name === 'ry');
    assert.ok(ry !== undefined);
    assert.notEqual(Number(ry.value), 0); // it reacted to the ball, i.e. sensing_of resolved
});

// Drive mouse clicks into the VM to exercise the tic-tac-toe games. Cell (row,col)
// centres map to scratch coords x = -80 + col*80, y = 80 - row*80.
async function loadRunning(code) {
    const c = new SB3Creator();
    c.parse(code);
    const buf = Buffer.from(await (await c.generateSB3()).arrayBuffer());
    const vm = new VM();
    await vm.loadProject(buf);
    vm.start();
    vm.greenFlag();
    for (let i = 0; i < 10; i++) vm.runtime._step();
    return vm;
}
function clickCell(vm, sx, sy) {
    const x = ((sx + 240) / 480) * 480;
    const y = ((180 - sy) / 360) * 360;
    vm.postIOData('mouse', { x, y, canvasWidth: 480, canvasHeight: 360, isDown: true });
    for (let i = 0; i < 40; i++) vm.runtime._step();
    vm.postIOData('mouse', { x, y, canvasWidth: 480, canvasHeight: 360, isDown: false });
    for (let i = 0; i < 10; i++) vm.runtime._step();
}
const boardOf = (vm) => {
    for (const t of vm.runtime.targets) for (const v of Object.values(t.variables)) if (v.name === 'board') return v.value;
};

test('vm: tic-tac-toe (2p) alternates X and O on clicks', async () => {
    const vm = await loadRunning(examples.tictactoe);
    clickCell(vm, -80, 80);   // player 1 -> cell 1
    clickCell(vm, 0, 80);     // player 2 -> cell 2
    const b = boardOf(vm);
    vm.quit();
    assert.equal(String(b[0]), '1', 'first click is X');
    assert.equal(String(b[1]), '2', 'second click is O');
});

test('vm: tic-tac-toe AI plays exactly one move per turn and blocks a win', async () => {
    const vm = await loadRunning(examples.tictactoe_ai);
    clickCell(vm, -80, 80);   // X @ cell 1; AI replies (takes centre)
    let b = boardOf(vm);
    assert.equal(b.filter((v) => String(v) === '1').length, 1);
    assert.equal(b.filter((v) => String(v) === '2').length, 1, 'AI makes exactly one move');

    clickCell(vm, 80, 80);    // X @ cell 3 -> threatens 1-2-3; AI must block at cell 2
    b = boardOf(vm);
    vm.quit();
    assert.equal(b.filter((v) => String(v) === '2').length, 2, 'still one AI move per turn');
    assert.equal(String(b[1]), '2', 'AI blocked the winning line at cell 2');
});

test('vm: 2048 slides and merges a line, keeps score, and spawns a tile', async () => {
    const c = new SB3Creator();
    c.parse(examples.g2048);
    const vm = new VM();
    await vm.loadProject(Buffer.from(await (await c.generateSB3()).arrayBuffer()));
    vm.start();
    vm.greenFlag();
    for (let i = 0; i < 15; i++) vm.runtime._step();
    const varOf = (n) => {
        for (const t of vm.runtime.targets) for (const x of Object.values(t.variables)) if (x.name === n) return x;
    };
    const grid = varOf('grid');
    const score = varOf('score');
    grid.value = [2, 2, 0, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    score.value = 0;
    vm.runtime.startHats('event_whenkeypressed', { KEY_OPTION: 'left arrow' });
    for (let i = 0; i < 30; i++) vm.runtime._step();
    const g = grid.value.map(Number);
    vm.quit();
    assert.equal(g[0], 4, 'row 0: 2+2 merged to 4 at the front');
    assert.equal(g[4], 8, 'row 1: 4+4 merged to 8 at the front');
    assert.equal(Number(score.value), 12, 'score = 4 + 8');
    assert.equal(g.filter((x) => x !== 0).length, 3, 'two merged tiles + one spawned tile');
});

test('vm: maze ghost AI chases the player across the grid', async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const c = new SB3Creator();
    c.parse(examples.maze);
    const vm = new VM();
    await vm.loadProject(Buffer.from(await (await c.generateSB3()).arrayBuffer()));
    vm.start();
    vm.greenFlag();
    await sleep(250);
    const v = (n) => {
        for (const t of vm.runtime.targets) for (const x of Object.values(t.variables)) if (x.name === n) return x.value;
    };
    assert.equal(`${v('prow')},${v('pcol')}`, '7,1', 'player starts bottom-left');
    // eat two dots to the right
    vm.runtime.startHats('event_whenkeypressed', { KEY_OPTION: 'right arrow' });
    await sleep(150);
    vm.runtime.startHats('event_whenkeypressed', { KEY_OPTION: 'right arrow' });
    await sleep(150);
    assert.equal(String(v('score')), '2', 'ate two dots');
    const gr0 = Number(v('grow'));
    const gc0 = Number(v('gcol'));
    await sleep(1600);
    const gr1 = Number(v('grow'));
    const gc1 = Number(v('gcol'));
    vm.quit();
    assert.ok(gr1 > gr0 || gc1 < gc0, `ghost should move toward the player (was ${gr0},${gc0} now ${gr1},${gc1})`);
});

test('vm: Connect Four AI drops with gravity and blocks a three-in-a-row', async () => {
    const c = new SB3Creator();
    c.parse(examples.connect4);
    const vm = new VM();
    await vm.loadProject(Buffer.from(await (await c.generateSB3()).arrayBuffer()));
    vm.start();
    vm.greenFlag();
    for (let i = 0; i < 12; i++) vm.runtime._step();
    const board = () => {
        for (const t of vm.runtime.targets) for (const x of Object.values(t.variables)) if (x.name === 'board') return x.value;
    };
    const clickCol = (col) => {
        const sx = -150 + col * 50;
        const x = ((sx + 240) / 480) * 480;
        const y = (180 / 360) * 360;
        vm.postIOData('mouse', { x, y, canvasWidth: 480, canvasHeight: 360, isDown: true });
        for (let i = 0; i < 50; i++) vm.runtime._step();
        vm.postIOData('mouse', { x, y, canvasWidth: 480, canvasHeight: 360, isDown: false });
        for (let i = 0; i < 8; i++) vm.runtime._step();
    };
    // player takes bottom cols 0,1,2 (open three); AI must block col 3
    clickCol(0);
    clickCol(1);
    clickCol(2);
    const b = board().map(Number);
    vm.quit();
    const bottom = b.slice(35, 42); // row 5
    assert.equal(bottom.filter((x) => x === 1).length, 3, 'three player discs sit on the bottom row (gravity)');
    assert.equal(b[38], 2, 'AI blocked the open three at column 3');
});

test('vm: Minesweeper flood-fill reveals a connected empty region', async () => {
    const c = new SB3Creator();
    c.parse(examples.minesweeper);
    const vm = new VM();
    await vm.loadProject(Buffer.from(await (await c.generateSB3()).arrayBuffer()));
    vm.start();
    vm.greenFlag();
    for (let i = 0; i < 20; i++) vm.runtime._step();
    const list = (n) => {
        for (const t of vm.runtime.targets) for (const x of Object.values(t.variables)) if (x.name === n) return x.value;
    };
    const mine = list('mine');
    const adj = list('adj');
    assert.equal(mine.filter((x) => String(x) === '1').length, 10, '10 mines placed');
    // find a 0-neighbour, non-mine cell and click it
    let tgt = -1;
    for (let idx = 0; idx < 81; idx++) if (String(mine[idx]) === '0' && String(adj[idx]) === '0') { tgt = idx; break; }
    assert.ok(tgt >= 0, 'there is an empty cell to click');
    const r = Math.floor(tgt / 9), col = tgt % 9;
    const x = ((-136 + col * 34 + 240) / 480) * 480;
    const y = ((180 - (136 - r * 34)) / 360) * 360;
    vm.postIOData('mouse', { x, y, canvasWidth: 480, canvasHeight: 360, isDown: true });
    for (let i = 0; i < 60; i++) vm.runtime._step();
    vm.postIOData('mouse', { x, y, canvasWidth: 480, canvasHeight: 360, isDown: false });
    for (let i = 0; i < 10; i++) vm.runtime._step();
    const revealed = list('revealed').filter((x) => String(x) === '1').length;
    vm.quit();
    assert.ok(revealed > 3, `flood-fill should reveal a region, got ${revealed}`);
});

test('vm: decompile round-trip preserves behaviour', async () => {
    const src = `SPRITE Calc:
  DEFINE add (n) times (k):
    set i to 0
    REPEAT UNTIL i > k:
      change total by n
      change i by 1
  WHEN flag clicked:
    set total to 0
    set a to (2 + 3) * 4
    set b to 17 mod 5
    add 5 times 2
    add 10 times 0`;
    const runState = async (code) => {
        const c = new SB3Creator();
        c.parse(code);
        const vm = new VM();
        await vm.loadProject(Buffer.from(await (await c.generateSB3()).arrayBuffer()));
        vm.start();
        vm.greenFlag();
        for (let i = 0; i < 80; i++) vm.runtime._step();
        const st = {};
        for (const t of vm.runtime.targets) for (const v of Object.values(t.variables)) st[v.name] = String(v.value);
        vm.quit();
        return st;
    };
    const before = await runState(src);
    const c = new SB3Creator();
    c.parse(src);
    const after = await runState(c.decompile());
    assert.equal(after.total, '25');
    assert.equal(after.a, '20');
    assert.equal(after.b, '2');
    assert.deepEqual(after, before, 'variable state identical before/after round trip');
});

test('tetris: pieces are real tetrominoes and all four keys respond', async () => {
    const c = new SB3Creator();
    c.parse(examples.tetris);
    const buf = Buffer.from(await (await c.generateSB3()).arrayBuffer());
    const vm = new VM();
    await vm.loadProject(buf);
    vm.start();
    vm.greenFlag();
    for (let i = 0; i < 6; i++) vm.runtime._step();

    const get = (n) => {
        for (const t of vm.runtime.targets) for (const v of Object.values(t.variables)) if (v.name === n) return v.value;
        return undefined;
    };
    const cells = () => [1, 2, 3, 4].map(i => `${get('cr' + i)},${get('cc' + i)}`).join(' ');
    const fire = (k) => { vm.runtime.startHats('event_whenkeypressed', {KEY_OPTION: k}); for (let i = 0; i < 3; i++) vm.runtime._step(); };

    // a tetromino is 4 distinct cells (not a 2x2 blob of coincident points)
    const spawn = new Set([1, 2, 3, 4].map(i => `${get('cr' + i)},${get('cc' + i)}`));
    assert.equal(spawn.size, 4, 'piece has 4 distinct cells');

    const before = cells();
    fire('right arrow');
    assert.notEqual(cells(), before, 'right arrow moves the piece');
    fire('left arrow');
    assert.equal(cells(), before, 'left arrow moves it back');
    const preRot = cells();
    fire('up arrow');
    assert.notEqual(cells(), preRot, 'up arrow rotates the piece');

    // soft-drop with the down arrow reaches the floor (row 19)
    let prev = '';
    for (let i = 0; i < 25 && prev !== cells(); i++) { prev = cells(); fire('down arrow'); }
    const lowest = Math.max(...[1, 2, 3, 4].map(i => Number(get('cr' + i))));
    assert.ok(lowest >= 18, `piece soft-dropped to the floor (row ${lowest})`);

    // real-time gravity locks the piece into the board
    const t0 = Date.now();
    while (Date.now() - t0 < 1600) vm.runtime._step();
    const board = get('board') || [];
    const filled = board.filter(x => Number(x) > 0).length;
    assert.ok(filled >= 4, `a locked piece fills >= 4 board cells (got ${filled})`);
    vm.quit();
});

test.after(() => { console.warn = origWarn; });
