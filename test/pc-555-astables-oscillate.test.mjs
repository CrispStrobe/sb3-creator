/**
 * pc67-555-tongenerator and pc87-stroboskop really oscillate.
 *
 * assert-physics checks their buzzer_tone_hz claim with the 1.44/((R1+2R2)C)
 * formula, which reads the timing network and nothing else. Both circuits once
 * had CONTROL wired straight to GND: the formula still agreed, but the upper
 * threshold sat at 0 V and the 555 never left its first state. Here the
 * committed circuit.json runs through time and the output edges are counted.
 * Measured on the engine when CONTROL was decoupled through 10 nF:
 * pc67 680 Hz, duty 52.8 %; pc87 7.10 Hz, duty 51 %.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the 555 astable oscillation checks');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

/** Sample the 555 output every dtMs for totalMs; return frequency and duty. */
function run (id, dtMs, totalMs) {
    const c = Circuit.fromJSON(JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8')));
    const b = c.board;
    const net = b.getNets().find(n => n.terminals.some(t => t.part === 'timer_555_3' && t.terminal === 'output'));
    assert.ok(net, `${id}: the 555 output is on no net`);
    const vcc = b.getNets().find(n => n.terminals.some(t => t.part === 'timer_555_3' && t.terminal === 'vcc'));
    let t = 0, high = 0, n = 0, prev = null;
    const rises = [];
    while (t < totalMs) {
        t += dtMs;
        b.advanceTo(BigInt(Math.round(t * 1e6)));
        assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${t} ms`);
        const v = b.nodeVoltages.get(net.id) ?? 0;
        const on = v > (b.nodeVoltages.get(vcc.id) ?? 5) / 2;
        if (prev === false && on) rises.push(t);
        if (on) high++;
        n++;
        prev = on;
    }
    const hz = rises.length > 2 ? (rises.length - 1) / ((rises.at(-1) - rises[0]) / 1000) : 0;
    return { hz, duty: high / n, edges: rises.length };
}

describe('555 astables with a decoupled CONTROL pin oscillate', { skip: SKIP }, () => {
    test('pc67-555-tongenerator: a tone near 686 Hz, duty a little over 50 %', () => {
        const r = run('pc67-555-tongenerator', 0.02, 30);
        assert.ok(r.edges > 10, `only ${r.edges} rising edges in 30 ms — not oscillating`);
        assert.ok(Math.abs(r.hz - 680) < 20, `frequency ${r.hz.toFixed(1)} Hz, measured 680`);
        assert.ok(Math.abs(r.duty - 0.528) < 0.03, `duty ${r.duty.toFixed(3)}, measured 0.528`);
    });

    test('pc87-stroboskop: about 7.1 flashes per second', () => {
        const r = run('pc87-stroboskop', 2, 2000);
        assert.ok(r.edges > 8, `only ${r.edges} rising edges in 2 s — not oscillating`);
        assert.ok(Math.abs(r.hz - 7.1) < 0.25, `frequency ${r.hz.toFixed(2)} Hz, measured 7.10`);
        assert.ok(Math.abs(r.duty - 0.51) < 0.03, `duty ${r.duty.toFixed(3)}, measured 0.51`);
    });
});
