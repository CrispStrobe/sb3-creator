// Emitted MicroPython must be executable, not just plausible: every `_stc*`
// driver name a program uses has to be DEFINED in the same output, or the
// program NameErrors on the board at the first pin access.
//
// This is the gate the STC driver fix is measured against. Before it, an STC
// program targeting a non-STC board emitted `_stc12.readPin(...)` /
// `_stc12.setPin(...)` without the driver that defines `_stc12` — measured over
// brickwright-lite's L3 corpus, 38 of 129 emits referenced an undefined `_stc*`
// (and every emit parsed as Python grammar, so a grammar check alone missed
// it). Here the same check runs over this repo's own example corpus, which
// carries STC programs, so the gate lives with the code it guards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';
import { corpusFloor } from './helpers/corpus-floor.mjs';

// A `_stc*` name is defined if it is assigned, def'd or class'd in the text.
function undefinedNames(py) {
    const used = new Set([...py.matchAll(/\b(_stc\w*)\b/g)].map((m) => m[1]));
    const bad = [];
    for (const n of used) {
        const def = new RegExp(`(?:^|\\n)\\s*${n}\\s*=|def\\s+${n}\\b|class\\s+${n}\\b`);
        if (!def.test(py)) bad.push(n);
    }
    return bad;
}

// Without a floor, an empty or renamed `examples` map would make this file emit
// zero subtests and report a clean pass. MEASURED 2026-09-05: the STC programs
// (stc_*) are the ones this gate exists for.
corpusFloor('STC example programs to check for executability',
    () => Object.keys(examples).filter((n) => n.startsWith('stc_')).length, 3,
    'micropython-executable.test.mjs checks every STC example emits a self-contained _stc driver.');

for (const [name, code] of Object.entries(examples).filter(([n]) => n.startsWith('stc_'))) {
    test(`emitted MicroPython for ${name} defines every _stc* name it uses`, () => {
        const c = new SB3Creator();
        c.parse(code);
        const r = c.generateMicroPython();
        if (!r.ok) return;                       // a refused program emits nothing to run
        if (!/_stc\w*/.test(r.py)) return;       // this program does not drive the STC path
        const bad = undefinedNames(r.py);
        assert.deepEqual(bad, [], `${name}: undefined _stc* name(s) ${bad.join(', ')} — the emit would NameError on the board`);
    });
}
