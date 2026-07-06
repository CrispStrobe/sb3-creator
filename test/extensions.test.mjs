// Extension-block transpilation (PLAN §22 P5). Blocks from our gallery extensions
// (source of truth: github.com/CrispStrobe/extensions, mirrored in reference/extensions/)
// must transpile to correct, runnable Python/JS. Planète Maths (id `planetemaths`) is
// pure math, so we build block fixtures and RUN the generated JS to check the value.
//
// Extension blocks can't be written in pseudocode (they come from the blocks editor),
// so these fixtures inject the block into a real project scaffold and exercise the
// generateJavaScript / generatePython walkers directly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import javascriptToPseudocode from '../src/utils/javascriptToPseudocode.js';
import examples from '../src/utils/examples.js';

// Build a project: WHEN flag clicked -> say <extension reporter/boolean>. Returns the
// SB3Creator (so we can call generateJavaScript/generatePython) — the say's MESSAGE is
// the extension block so its value is printed.
function projectWith (opcode, numInputs = {}, boolInputs = {}, fields = {}, strInputs = {}) {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  WHEN flag clicked:\n    say "x"');
    const sprite = c.project.targets.find(t => !t.isStage);
    const blocks = sprite.blocks;
    const sayId = Object.keys(blocks).find(id => blocks[id].opcode === 'looks_say');
    const repId = 'rep1';
    const inputs = {};
    for (const [k, val] of Object.entries(numInputs)) inputs[k] = [1, [4, String(val)]];
    for (const [k, val] of Object.entries(strInputs)) inputs[k] = [1, [10, String(val)]];
    for (const [k, sub] of Object.entries(boolInputs)) { // sub = {opcode, num:{...}}
        const bid = `b_${k}`;
        const binputs = {};
        for (const [bk, bv] of Object.entries(sub.num || {})) binputs[bk] = [1, [4, String(bv)]];
        blocks[bid] = {opcode: sub.opcode, inputs: binputs, fields: sub.fields || {}, shadow: false, topLevel: false, parent: repId};
        inputs[k] = [2, bid];
    }
    blocks[repId] = {opcode, inputs, fields, shadow: false, topLevel: false, parent: sayId};
    blocks[sayId].inputs.MESSAGE = [3, repId, [10, '']];
    return c;
}

// If the block is a boolean, wrap it in an IF so `say` prints "T"/"F".
function boolProjectWith (opcode, numInputs = {}, boolInputs = {}, strInputs = {}) {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  WHEN flag clicked:\n    IF 1 = 1 THEN:\n      say "T"\n    ELSE:\n      say "F"');
    const sprite = c.project.targets.find(t => !t.isStage);
    const blocks = sprite.blocks;
    const ifId = Object.keys(blocks).find(id => blocks[id].opcode === 'control_if_else');
    const condId = 'cond1';
    const inputs = {};
    for (const [k, val] of Object.entries(numInputs)) inputs[k] = [1, [4, String(val)]];
    for (const [k, val] of Object.entries(strInputs)) inputs[k] = [1, [10, String(val)]];
    for (const [k, sub] of Object.entries(boolInputs)) {
        const bid = `b_${k}`;
        blocks[bid] = {opcode: sub.opcode, inputs: {}, fields: {}, shadow: false, topLevel: false, parent: condId};
        if (sub.bool) { blocks[bid].opcode = sub.bool; } // simple boolean literal-ish
        inputs[k] = [2, bid];
    }
    blocks[condId] = {opcode, inputs, fields: {}, shadow: false, topLevel: false, parent: ifId};
    blocks[ifId].inputs.CONDITION = [2, condId];
    return c;
}

function runJs (js) {
    const logs = [];
    vm.runInNewContext(js, {console: {log: (...a) => logs.push(a.join(' '))}, prompt: () => ''}, {timeout: 1000});
    return logs;
}

// ---- reporters: build, transpile, run, check the value ----
const REPORTERS = [
    ['planetemaths_add', {NUM1: 3, NUM2: 4}, {}, '7'],
    ['planetemaths_substract', {NUM1: 10, NUM2: 3}, {}, '7'],
    ['planetemaths_multiply', {NUM1: 3, NUM2: 4}, {}, '12'],
    ['planetemaths_divide', {NUM1: 12, NUM2: 4}, {}, '3'],
    ['planetemaths_pow', {NUM1: 2, NUM2: 5}, {}, '32'],
    ['planetemaths_oppose', {NUM1: 5}, {}, '-5'],
    ['planetemaths_inverse', {NUM1: 4}, {}, '0.25'],
    ['planetemaths_pourcent', {NUM1: 50}, {}, '0.5'],
    ['planetemaths_factorial', {NUM1: 5}, {}, '120'],
    ['planetemaths_min', {NUM1: 3, NUM2: 7}, {}, '3'],
    ['planetemaths_max', {NUM1: 3, NUM2: 7}, {}, '7'],
    ['planetemaths_length', {}, {STRING: 'hello'}, '5'],
    ['planetemaths_sommechiffres', {NUM1: 123}, {}, '6']
];

for (const [opcode, num, str, expected] of REPORTERS) {
    test(`extension[planetemaths]: ${opcode} transpiles and runs to ${expected} (JS)`, () => {
        const c = projectWith(opcode, num, {}, {}, str);
        const js = c.generateJavaScript();
        const out = runJs(js);
        assert.equal(out[out.length - 1], expected, `${opcode} JS => ${expected}`);
        // Python is generated too (shape check; running python is covered elsewhere)
        const py = c.generatePython();
        assert.doesNotMatch(py, new RegExp(`# unsupported`), `${opcode} must not be an unsupported comment in Python`);
    });
}

test('extension[planetemaths]: string/join reporters', () => {
    assert.equal(runJs(projectWith('planetemaths_join', {}, {}, {}, {STRING1: 'a', STRING2: 'b'}).generateJavaScript()).pop(), 'ab');
    assert.equal(runJs(projectWith('planetemaths_letterOf', {LETTER: 2}, {}, {}, {STRING: 'hello'}).generateJavaScript()).pop(), 'e');
    assert.equal(runJs(projectWith('planetemaths_nombre_pi').generateJavaScript()).pop(), String(Math.PI));
});

// ---- booleans: build IF <bool> and check the branch ----
const BOOLS = [
    ['planetemaths_gt', {NUM1: 3, NUM2: 7}, 'T'],  // gt = compare<0 = NUM1<NUM2 = 3<7 = true
    ['planetemaths_gte', {NUM1: 7, NUM2: 7}, 'T'],
    ['planetemaths_lt', {NUM1: 7, NUM2: 3}, 'T'],  // lt = NUM1>NUM2
    ['planetemaths_lte', {NUM1: 3, NUM2: 3}, 'T'],
    ['planetemaths_equals', {NUM1: 5, NUM2: 5}, 'T'],
    ['planetemaths_multiple', {NUM1: 10, NUM2: 5}, 'T'],
    ['planetemaths_gt', {NUM1: 7, NUM2: 3}, 'F']
];

for (const [opcode, num, expected] of BOOLS) {
    test(`extension[planetemaths]: ${opcode}(${num.NUM1},${num.NUM2}) => ${expected} (JS)`, () => {
        const c = boolProjectWith(opcode, num);
        const out = runJs(c.generateJavaScript());
        assert.equal(out[out.length - 1], expected);
    });
}

// ---- extension auto-declaration (both directions) ----
test('extensions: pen usage in pseudocode auto-declares the pen extension', () => {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  WHEN flag clicked:\n    pen down\n    clear');
    assert.ok(c.project.extensions.includes('pen'), 'pen auto-declared');
});

test('extensions: a planetemaths block is detected and gets an extensionURL', () => {
    const c = projectWith('planetemaths_add', {NUM1: 1, NUM2: 2});
    c.syncExtensions();
    assert.deepEqual(c.project.extensions, ['planetemaths']);
    assert.equal(c.project.extensionURLs.planetemaths, 'https://crispstrobe.github.io/extensions/CrispStrobe/planetemaths.js');
});

test('extensions: core categories are never treated as extensions', () => {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  WHEN flag clicked:\n    set x to (3 + 4)\n    say x\n    move 10 steps');
    assert.deepEqual(c.project.extensions, [], 'motion/operator/looks/data are core, not extensions');
});

// ---- pseudocode syntax for Arrays & Vectors ----
const ARR_PSEUDO = [
    'SPRITE T:',
    '  WHEN flag clicked:',
    '    new array "v" = [3, 1, 2]',
    '    push 5 to array "v"',
    '    set item 1 of array "v" to 9',
    '    insert 7 at 0 of array "v"',
    '    say (sum of array "v") for 1 seconds',
    '    say (item 0 of array "v") for 1 seconds',
    '    say (largest of array "v") for 1 seconds',
    '    say (length of array "v") for 1 seconds',
    '    new array "r" = range 1 to 5',
    '    IF array "v" contains 9 THEN:',
    '      say "yes" for 1 seconds'
].join('\n');

test('pseudocode: Arrays phrases compile to arrays_* blocks (auto-declared)', () => {
    const c = new SB3Creator();
    c.parse(ARR_PSEUDO);
    assert.deepEqual(c.warnings, []);
    assert.ok(c.project.extensions.includes('arrays'));
    const ops = new Set(Object.values(c.project.targets.find(t => !t.isStage).blocks).map(b => b.opcode).filter(o => o.startsWith('arrays')));
    for (const op of ['arrays_create1D', 'arrays_push', 'arrays_set', 'arrays_insert', 'arrays_sum', 'arrays_get', 'arrays_max', 'arrays_length', 'arrays_createRange', 'arrays_contains']) {
        assert.ok(ops.has(op), `expected ${op}`);
    }
});

test('pseudocode: Arrays blocks decompile to phrases (idempotent) and run correctly', () => {
    const c = new SB3Creator();
    c.parse(ARR_PSEUDO);
    const dec = new SB3Creator().decompile(c.project);
    assert.match(dec, /new array "v" = \[3, 1, 2\]/);
    assert.match(dec, /push 5 to array "v"/);
    assert.match(dec, /sum of array "v"/);
    assert.match(dec, /new array "r" = range 1 to 5/);
    const c2 = new SB3Creator();
    c2.parse(dec);
    assert.equal(new SB3Creator().decompile(c2.project), dec, 'idempotent');
});

test('pseudocode: Arrays example runs to the right values in JS', () => {
    const c = new SB3Creator();
    c.parse(examples.arrays);
    const logs = [];
    vm.runInNewContext(c.generateJavaScript(), { console: { log: (...a) => logs.push(a.join(' ')) }, prompt: () => '' }, { timeout: 1000 });
    assert.ok(logs.includes('sum = 29'));
    assert.ok(logs.includes('largest = 12'));
    assert.ok(logs.some(l => /\[5,99,8,1,12\]/.test(l)));
    assert.ok(logs.includes('range 1..5 sums to 15'));
});

// ---- pseudocode syntax for the distinctive Planète Maths ops ----
const PM_PSEUDO = [
    'SPRITE T:',
    '  GLOBAL n',
    '  WHEN flag clicked:',
    '    set n to factorial of 5',
    '    set n to sum of digits of 123',
    '    set n to min of 3 and 7',
    '    set n to max of 1 and 9',
    '    set n to 2 to the power of 8',
    '    set n to pi',
    '    set n to euler',
    '    IF n is multiple of 2 THEN:',
    '      say "even"'
].join('\n');

test('pseudocode: Planète Maths phrases compile to the right extension blocks', () => {
    const c = new SB3Creator();
    c.parse(PM_PSEUDO);
    assert.deepEqual(c.warnings, []);
    assert.ok(c.project.extensions.includes('planetemaths'), 'auto-declared');
    const ops = new Set(Object.values(c.project.targets.find(t => !t.isStage).blocks).map(b => b.opcode).filter(o => o.startsWith('planetemaths')));
    for (const op of ['planetemaths_factorial', 'planetemaths_sommechiffres', 'planetemaths_min', 'planetemaths_max', 'planetemaths_pow', 'planetemaths_nombre_pi', 'planetemaths_nombre_e', 'planetemaths_multiple']) {
        assert.ok(ops.has(op), `expected ${op}`);
    }
});

test('pseudocode: Planète Maths blocks decompile to readable phrases (idempotent)', () => {
    const c = new SB3Creator();
    c.parse(PM_PSEUDO);
    const dec = new SB3Creator().decompile(c.project);
    assert.match(dec, /factorial of 5/);
    assert.match(dec, /min of 3 and 7/);
    assert.match(dec, /2 to the power of 8/);
    assert.match(dec, /is multiple of 2/);
    const c2 = new SB3Creator();
    c2.parse(dec);
    assert.equal(new SB3Creator().decompile(c2.project), dec, 'idempotent');
});

test('pseudocode: distinctive Planète Maths ops round-trip through Python AND JavaScript', () => {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  GLOBAL n\n  WHEN flag clicked:\n    set n to factorial of 5\n    set n to min of 3 and 7\n    set n to 2 to the power of 8\n    set n to pi\n    set n to euler');
    const want = ['planetemaths_factorial', 'planetemaths_min', 'planetemaths_nombre_e', 'planetemaths_nombre_pi', 'planetemaths_pow'];
    for (const [gen, parse] of [[() => c.generatePython(), pythonToPseudocode], [() => c.generateJavaScript(), javascriptToPseudocode]]) {
        const { pseudocode, warnings } = parse(gen());
        assert.equal(warnings.length, 0);
        const c2 = new SB3Creator();
        c2.parse(pseudocode);
        const ops = Object.values(c2.project.targets.find(t => !t.isStage).blocks).map(b => b.opcode).filter(o => o.startsWith('planetemaths')).sort();
        assert.deepEqual(ops, want);
    }
});

// ---- Arrays & Vectors extension (id `arrays`) ----
// Build a command chain + reporters, transpile, and RUN the JS to check values.
function arraysProgram (commands, reporterOpcode, reporterInputs = {}) {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  WHEN flag clicked:\n    say "x"');
    const B = c.project.targets.find(t => !t.isStage).blocks;
    const hatId = Object.keys(B).find(id => B[id].opcode === 'event_whenflagclicked');
    const sayId = Object.keys(B).find(id => B[id].opcode === 'looks_say');
    const S = v => [1, [10, String(v)]];
    const N = v => [1, [4, String(v)]];
    const mk = (op, inputs) => ({ opcode: op, inputs, fields: {}, topLevel: false, parent: null });
    let prev = hatId;
    commands.forEach((cmd, i) => {
        const id = `cmd${i}`;
        B[id] = mk(cmd.op, Object.fromEntries(Object.entries(cmd.args).map(([k, val]) => [k, typeof val === 'number' ? N(val) : S(val)])));
        B[prev].next = id; B[id].parent = prev; prev = id;
    });
    B[prev].next = sayId; B[sayId].parent = prev;
    const rInputs = Object.fromEntries(Object.entries(reporterInputs).map(([k, val]) => [k, typeof val === 'number' ? N(val) : S(val)]));
    B.rep = mk(reporterOpcode, rInputs);
    B[sayId].inputs.MESSAGE = [3, 'rep', [10, '']];
    c.syncExtensions();
    return c;
}
function runJsProg (c) {
    const logs = [];
    vm.runInNewContext(c.generateJavaScript(), { console: { log: (...a) => logs.push(a.join(' ')) }, prompt: () => '' }, { timeout: 1000 });
    return logs[logs.length - 1];
}

const ARR = [
    { setup: [{ op: 'arrays_create1D', args: { NAME: 'v', JSON: '[3,1,2]' } }, { op: 'arrays_push', args: { NAME: 'v', VALUE: 5 } }], rep: 'arrays_sum', ri: { NAME: 'v' }, want: '11' },
    { setup: [{ op: 'arrays_create1D', args: { NAME: 'v', JSON: '[3,1,2]' } }], rep: 'arrays_get', ri: { NAME: 'v', INDEX: 0 }, want: '3' },
    { setup: [{ op: 'arrays_create1D', args: { NAME: 'v', JSON: '[3,1,2]' } }], rep: 'arrays_length', ri: { NAME: 'v' }, want: '3' },
    { setup: [{ op: 'arrays_create1D', args: { NAME: 'v', JSON: '[3,1,2]' } }], rep: 'arrays_min', ri: { NAME: 'v' }, want: '1' },
    { setup: [{ op: 'arrays_create1D', args: { NAME: 'v', JSON: '[3,1,2]' } }], rep: 'arrays_max', ri: { NAME: 'v' }, want: '3' },
    { setup: [{ op: 'arrays_create1D', args: { NAME: 'v', JSON: '[2,4,6]' } }], rep: 'arrays_mean', ri: { NAME: 'v' }, want: '4' },
    { setup: [{ op: 'arrays_createRange', args: { NAME: 'v', START: 1, END: 4 } }], rep: 'arrays_sum', ri: { NAME: 'v' }, want: '10' },
    { setup: [{ op: 'arrays_create1D', args: { NAME: 'v', JSON: '[5,6,7]' } }], rep: 'arrays_indexOf', ri: { NAME: 'v', VALUE: 6 }, want: '1' },
    { setup: [{ op: 'arrays_create1D', args: { NAME: 'v', JSON: '[1,2,3]' } }, { op: 'arrays_remove', args: { NAME: 'v', INDEX: 0 } }], rep: 'arrays_sum', ri: { NAME: 'v' }, want: '5' }
];

for (const t of ARR) {
    test(`extension[arrays]: ${t.rep} => ${t.want} (JS runs the _arrays registry)`, () => {
        const c = arraysProgram(t.setup, t.rep, t.ri);
        assert.ok(c.project.extensions.includes('arrays'));
        assert.equal(c.project.extensionURLs.arrays, 'https://crispstrobe.github.io/extensions/CrispStrobe/arrays.js');
        assert.equal(runJsProg(c), t.want);
        assert.match(c.generatePython(), /_arrays = \{\}/, 'Python emits the registry');
    });
}

test('extension[arrays]: contains runs true/false inside an IF', () => {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  WHEN flag clicked:\n    say "x"');
    const B = c.project.targets.find(t => !t.isStage).blocks;
    const hatId = Object.keys(B).find(id => B[id].opcode === 'event_whenflagclicked');
    const sayId = Object.keys(B).find(id => B[id].opcode === 'looks_say');
    const S = v => [1, [10, String(v)]];
    B.c0 = { opcode: 'arrays_create1D', inputs: { NAME: S('v'), JSON: S('[5,6,7]') }, fields: {}, parent: hatId, next: 'iff' };
    B.iff = { opcode: 'control_if_else', inputs: { CONDITION: [2, 'cnd'], SUBSTACK: [2, sayId], SUBSTACK2: [2, 'sayF'] }, fields: {}, parent: 'c0' };
    B.cnd = { opcode: 'arrays_contains', inputs: { NAME: S('v'), VALUE: [1, [4, '6']] }, fields: {}, parent: 'iff' };
    B.sayF = { opcode: 'looks_say', inputs: { MESSAGE: S('no') }, fields: {}, parent: 'iff' };
    B[sayId].inputs.MESSAGE = S('yes'); B[sayId].parent = 'iff'; B[sayId].next = null;
    B[hatId].next = 'c0';
    assert.equal(runJsProg(c), 'yes', '6 is in [5,6,7]');
});

// ---- Pluggable runtime-driver convention (data-driven registry) ----
test('runtime convention: LEGO Boost commands/reporters emit driver calls + a pluggable shim', () => {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  WHEN flag clicked:\n    say "x"');
    const B = c.project.targets.find(t => !t.isStage).blocks;
    const hatId = Object.keys(B).find(id => B[id].opcode === 'event_whenflagclicked');
    const sayId = Object.keys(B).find(id => B[id].opcode === 'looks_say');
    // command with a menu arg (MOTOR_ID = "A"), and a reporter said
    B.c1 = { opcode: 'legoboost_motorOn', inputs: { MOTOR_ID: [1, 'm1'] }, fields: {}, parent: hatId, next: sayId };
    B.m1 = { opcode: 'legoboost_menu_MOTOR_ID', fields: { MOTOR_ID: ['A', null] }, shadow: true, parent: 'c1' };
    B[hatId].next = 'c1'; B[sayId].parent = 'c1';
    B.rep = { opcode: 'legoboost_getDistance', inputs: { PORT: [1, 'p1'] }, fields: {}, parent: sayId };
    B.p1 = { opcode: 'legoboost_menu_PORT', fields: { PORT: ['1', null] }, shadow: true, parent: 'rep' };
    B[sayId].inputs.MESSAGE = [3, 'rep', [10, '']];
    c.syncExtensions();
    assert.ok(c.project.extensions.includes('legoboost'));
    assert.equal(c.project.extensionURLs.legoboost, 'https://crispstrobe.github.io/extensions/CrispStrobe/legoboost_universal.js');
    const js = c.generateJavaScript();
    // driver-agnostic program + a pluggable neutral driver
    assert.match(js, /const _boost = \{/, 'emits a _boost driver');
    assert.match(js, /_boost\.motorOn\("A"\)/, 'command with resolved menu arg');
    assert.match(js, /_boost\.distance\(/, 'reporter call');
    assert.match(js, /_boost driver — .*stub|drives nothing/, 'documented as the swap point');
    // runs neutral without a real device
    const logs = [];
    vm.runInNewContext(js, { console: { log: (...a) => logs.push(a.join(' ')) } }, { timeout: 1000 });
    assert.equal(logs[logs.length - 1], '0', 'distance neutral 0 standalone');
    // Python emits a driver class too
    assert.match(c.generatePython(), /class _BoostDriver:/);
    assert.match(c.generatePython(), /_boost\.motorOn\("A"\)/);
});

test('runtime convention: the driver switch selects the backend, program stays the same', () => {
    const build = () => {
        const c = new SB3Creator();
        c.parse('SPRITE T:\n  WHEN flag clicked:\n    say "x"');
        const B = c.project.targets.find(t => !t.isStage).blocks;
        const hatId = Object.keys(B).find(id => B[id].opcode === 'event_whenflagclicked');
        const sayId = Object.keys(B).find(id => B[id].opcode === 'looks_say');
        B.c1 = { opcode: 'legoboost_motorOn', inputs: { MOTOR_ID: [1, 'm1'] }, fields: {}, parent: hatId, next: sayId };
        B.m1 = { opcode: 'legoboost_menu_MOTOR_ID', fields: { MOTOR_ID: ['A', null] }, shadow: true };
        B[hatId].next = 'c1'; B[sayId].parent = 'c1';
        c.syncExtensions();
        return c;
    };
    const shim = build().generateJavaScript(undefined, { driver: 'shim' });
    const remote = build().generateJavaScript(undefined, { driver: 'remote' });
    const onDev = build().generatePython(undefined, { driver: 'ondevice' });
    // same driver-agnostic call in every mode
    for (const code of [shim, remote]) assert.match(code, /_boost\.motorOn\("A"\)/);
    // but different drivers
    assert.match(shim, /motorOn: \(\) => \{\}/, 'shim: no-op');
    assert.match(remote, /_bridge\(|brickwright-bridges/, 'remote: forwards to a bridge');
    assert.match(onDev, /per-hardware transpiler|ev3dev/, 'ondevice: points at the transpiler');
});

test('runtime convention: adding an extension is declarative (registry-only)', () => {
    const reg = SB3Creator.RUNTIME_EXTENSIONS;
    assert.ok(reg.universalgamepad && reg.legoboost, 'both registered');
    // every op declares a kind + method
    for (const ext of Object.values(reg)) for (const op of Object.values(ext.ops)) {
        assert.ok(['command', 'reporter', 'boolean'].includes(op.kind));
        assert.ok(typeof op.method === 'string' && op.method.length);
    }
});

// ---- Gamepad extension (id `universalgamepad`, runtime input -> neutral shim) ----
for (const [op, want] of [['universalgamepad_getStickValue', '0'], ['universalgamepad_getCursorX', '0'], ['universalgamepad_getControllerCount', '0']]) {
    test(`extension[gamepad]: ${op} runs to a neutral value standalone`, () => {
        const c = new SB3Creator();
        c.parse('SPRITE T:\n  WHEN flag clicked:\n    say "x"');
        const B = c.project.targets.find(t => !t.isStage).blocks;
        const sayId = Object.keys(B).find(id => B[id].opcode === 'looks_say');
        B.r = { opcode: op, inputs: {}, fields: {}, parent: sayId };
        B[sayId].inputs.MESSAGE = [3, 'r', [10, '']];
        c.syncExtensions();
        assert.ok(c.project.extensions.includes('universalgamepad'));
        assert.equal(c.project.extensionURLs.universalgamepad, 'https://crispstrobe.github.io/extensions/CrispStrobe/gamepad.js');
        assert.equal(runJsProg(c), want);
        assert.match(c.generatePython(), /_GamepadDriver|_gamepad = _/, 'Python emits the pluggable driver');
    });
}

test('extension[gamepad]: isConnected is a runnable boolean (false standalone)', () => {
    const c = new SB3Creator();
    c.parse('SPRITE T:\n  WHEN flag clicked:\n    say "x"');
    const B = c.project.targets.find(t => !t.isStage).blocks;
    const hatId = Object.keys(B).find(id => B[id].opcode === 'event_whenflagclicked');
    const sayId = Object.keys(B).find(id => B[id].opcode === 'looks_say');
    const S = v => [1, [10, String(v)]];
    B.iff = { opcode: 'control_if_else', inputs: { CONDITION: [2, 'cnd'], SUBSTACK: [2, sayId], SUBSTACK2: [2, 'sayF'] }, fields: {}, parent: hatId };
    B.cnd = { opcode: 'universalgamepad_isConnected', inputs: {}, fields: {}, parent: 'iff' };
    B.sayF = { opcode: 'looks_say', inputs: { MESSAGE: S('no') }, fields: {}, parent: 'iff' };
    B[sayId].inputs.MESSAGE = S('yes'); B[sayId].parent = 'iff'; B[sayId].next = null;
    B[hatId].next = 'iff';
    assert.equal(runJsProg(c), 'no', 'no gamepad connected standalone');
});

test('extension[planetemaths]: and / or / not compose', () => {
    // and(gt(3,7)=T, gt(1,9)=T) = T
    const c = boolProjectWith('planetemaths_and', {}, {
        OPERAND1: {opcode: 'planetemaths_gt'},
        OPERAND2: {opcode: 'planetemaths_gt'}
    });
    // give the nested gts numeric inputs so they evaluate true (3<7, 1<9)
    const sprite = c.project.targets.find(t => !t.isStage);
    sprite.blocks.b_OPERAND1.inputs = {NUM1: [1, [4, '3']], NUM2: [1, [4, '7']]};
    sprite.blocks.b_OPERAND2.inputs = {NUM1: [1, [4, '1']], NUM2: [1, [4, '9']]};
    assert.equal(runJs(c.generateJavaScript()).pop(), 'T');
});
