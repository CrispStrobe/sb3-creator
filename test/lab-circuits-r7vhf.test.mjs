/**
 * The round-7 VHF bench from `scripts/gen-lab-circuits-4.mjs --set=r7vhf`
 * does what its EXPECTED.md says, measured on the COMMITTED circuit.json with
 * the control a learner turns: the folded dipole's turn.
 *
 * The dipole feeds a tuned field-strength meter: the tank's RF envelope and
 * the meter's reading follow cos(turn − bearing).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine } from '../scripts/lib/engine-surface.mjs';
import { BENCHES, benchIds } from '../scripts/lib/lab-benches-r7vhf.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the lab bench scenarios (set r7vhf, a dipole on a VHF receiver)');
const SKIP = gate.skip || false;

let Circuit;
if (!SKIP) ({ Circuit } = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] }));

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

function bench (id) {
    const json = JSON.parse(readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
    const c = Circuit.fromJSON(json);
    const b = c.board;
    const ids = benchIds(BENCHES[id]);
    let tMs = 0;
    const netOf = (name, term) => {
        const n = b.getNets().find(n => n.terminals.some(x => x.part === ids[name] && x.terminal === term));
        assert.ok(n, `${id}: no net for ${name}.${term}`);
        return n.id;
    };
    return {
        b, ids,
        meter (name) { return b.getDeviceState(ids[name])?.reading; },
        rf (name, term) { return Math.max(0, ...b._radio.bandAmplitudes(netOf(name, term)).map(x => x.volts)); },
        run (ms) {
            tMs += ms;
            b.advanceTo(BigInt(Math.round(tMs * 1e6)));
            assert.equal(b.transientAnalysisStatus().failure, null, `${id}: solver failed by ${tMs} ms`);
            assert.equal(b._radio?.error ?? null, null, `${id}: radio front end error`);
        },
        set (name, value) { b.setControl(ids[name], value); },
    };
}

describe('lab VHF bench (set r7vhf) behaves as documented', { skip: SKIP }, () => {
    test('lab-dipole-turn: broadside full, at 45° cos 45°, end-on nothing, half round the same (two-sided)', () => {
        const at = (turn) => {
            const x = bench('lab-dipole-turn');
            x.set('dp', turn);
            x.run(5);
            return { tank: x.rf('l', 'b'), meter: x.meter('meter') };
        };
        const r0 = at(0), r45 = at(0.125), r90 = at(0.25), r180 = at(0.5);
        // MEASURED 2026-11-25: tank 0.0797 / 0.0564 / 0 / 0.0797 V peak; meter 16.4 / 8.5 / 0 / 16.4 mV.
        assert.ok(r0.tank > 0.05, `broadside: the tank swings ${r0.tank.toFixed(4)} V`);
        assert.ok(Math.abs(r45.tank / r0.tank - Math.SQRT1_2) < 0.02, `45°: cos 45° of it (${(r45.tank / r0.tank).toFixed(3)})`);
        assert.ok(r90.tank < r0.tank * 1e-3, `end-on: nothing (${r90.tank.toExponential(2)} V)`);
        assert.ok(Math.abs(r180.tank / r0.tank - 1) < 0.01, `turned half round: the same again (${(r180.tank / r0.tank).toFixed(4)})`);
        // MEASURED 2026-11-25: meter at 0° -> observed 0.0164 V.
        assert.ok(r0.meter > 0.01 && r0.meter > 1.5 * r45.meter && r90.meter < 0.001, `the meter: ${r0.meter}, ${r45.meter}, ${r90.meter} V`);
    });
});
