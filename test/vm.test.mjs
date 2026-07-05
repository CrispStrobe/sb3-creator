// Live VM tests: run generated projects in the REAL Scratch VM (headless) and
// assert both that every project loads and that feature logic actually executes.
// scratch-vm runs blocks without a renderer, so collision/rendering is inert, but
// variables, lists, custom blocks, clones, and control flow run for real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import VM from 'scratch-vm';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';

// Silence the "no storage module" asset warnings for a clean test log.
const origWarn = console.warn;
console.warn = () => {};

async function run(code, frames = 60) {
    const c = new SB3Creator();
    c.parse(code);
    const buf = Buffer.from(await (await c.generateSB3()).arrayBuffer());
    const vm = new VM();
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

test.after(() => { console.warn = origWarn; });
