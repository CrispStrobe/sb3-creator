/**
 * `ttl-clock-module`'s step button moves something, and the something remembers.
 *
 * THE DEFECT (D27)
 * ----------------
 * The bench's own intro promised "one pulse per press — essential for
 * single-stepping the CPU", and `EXPECTED.md` said "The manual step button
 * injects a single pulse when pressed". Measured through the engine, the net
 * that button drove carried exactly two terminals — `btn1.b` and `r3.a` — and
 * `r3`'s other end went to ground. Pressing it moved a node that nothing read.
 * The board had no state at all, so there was nothing a pulse could step.
 *
 * THE REPAIR, and what it deliberately did NOT do
 * -----------------------------------------------
 * The 555 half is untouched. It would have been easy to route the button into
 * the oscillator — onto RESET, or onto the output node — and that would have
 * moved the numbers `machines-clocks` teaches (the astable's period, the pot
 * sweep, the LED's 4.46 V / 0 V swing) while claiming to fix a dead button.
 * D11's rule applies: a bench change that disturbs what another lesson measures
 * is not the cheap fix it looks like. So the step button keeps its own node —
 * `vcc -> btn1 -> node -> r3(10 k) -> gnd`, unchanged — and that node now
 * clocks a D flip-flop wired as a divide-by-two, whose Q drives a second LED.
 *
 * WHY A FLIP-FLOP RATHER THAN A LAMP ON THE BUTTON
 * -----------------------------------------------
 * A lamp would light while the button is held and go out when it is released,
 * which is a button, not a step. What makes a clock module a clock module is
 * that the EDGE advances something that then STAYS advanced. So the assertion
 * that matters below is not "Q changes" but "Q is unchanged by the release".
 *
 * HAND-COMPUTED, not merely observed. The dff model drives 5 V behind
 * R_OUT = 50 Ω (bw-board `src/devices/digital-ics.js`) into r4 = 220 Ω and a
 * red LED. The solve settles at 10.714 mA, so:
 *
 *     drop across R_OUT = 10.714 mA x 50 Ω = 0.5357 V
 *     Q                 = 5 V - 0.5357 V   = 4.4643 V
 *     brightness        = 10.714 mA / 20 mA = 0.5357
 *
 * which is what the table in EXPECTED.md records.
 *
 * MUTATION: delete the `b21 <-> b46` hole wire (the one that carries the step
 * node to `ff1.clk`) and the first test goes red on the netlist, before any
 * voltage is read — which is the shape the old bench had.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { injectEngine, registerSidecars } from '../scripts/lib/engine-surface.mjs';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const CIRCUIT = join(SB3, 'examples', 'ttl-clock-module', 'circuit.json');

const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, "ttl-clock-module's step button");

const MS = 1000000n;

async function load () {
    const { Circuit } = await injectEngine({ board: BWB, cui: CUI });
    await registerSidecars(CUI);
    return Circuit.fromJSON(JSON.parse(readFileSync(CIRCUIT, 'utf8')));
}

const netWith = (board, part, terminal) => board.nets.find(
    (n) => n.terminals.some((t) => t.part === part && t.terminal === terminal));

describe("ttl-clock-module: the step button clocks a register", { skip: gate.skip }, () => {
    test('the step net reaches a clock input, not only a pull-down', async () => {
        const c = await load();
        const step = netWith(c.board, 'btn1', 'b');
        assert.ok(step, 'the button has a net at all');
        const on = step.terminals.map((t) => `${t.part}.${t.terminal}`).sort();
        assert.deepEqual(on, ['btn1.b', 'ff1.clk', 'r3.a'],
            'the step node must carry a CLOCK INPUT beside the pull-down. Two terminals '
            + '(btn1.b and r3.a) is the defect: a node nothing reads.');
    });

    test('the register is wired to toggle, and its output drives a lamp', async () => {
        const c = await load();
        // D fed from /Q is the divide-by-two: one edge, one change of state.
        const d = netWith(c.board, 'ff1', 'd').terminals.map((t) => `${t.part}.${t.terminal}`).sort();
        assert.deepEqual(d, ['ff1.d', 'ff1.q_bar'], 'D must come back from /Q');
        const q = netWith(c.board, 'ff1', 'q').terminals.map((t) => `${t.part}.${t.terminal}`).sort();
        assert.deepEqual(q, ['ff1.q', 'r4.a'], 'Q must drive the step LED through its resistor');
    });

    test('a press advances the register and the RELEASE does not undo it', async () => {
        const c = await load();
        const b = c.board;
        const qNet = netWith(b, 'ff1', 'q').id;
        const stepNet = netWith(b, 'btn1', 'b').id;
        let t = 0n;
        const adv = (ms) => { t += BigInt(ms) * MS; b.advanceTo(t); };
        const q = () => +b.nodeVoltage(qNet).toFixed(4);
        const stepV = () => +b.nodeVoltage(stepNet).toFixed(4);

        adv(10);
        assert.equal(stepV(), 0, 'at rest the step node is pulled to ground through r3');
        assert.equal(q(), 0, 'the register powers up cleared');

        const seen = [];
        for (let i = 0; i < 4; i++) {
            c.setControl('btn1', 1);
            adv(20);
            assert.equal(stepV(), 5, `press ${i + 1}: the button must pull its node to the rail`);
            const held = q();
            c.setControl('btn1', 0);
            adv(20);
            assert.equal(stepV(), 0, `release ${i + 1}: the node falls back through r3`);
            assert.equal(q(), held,
                `release ${i + 1}: the register must HOLD. A level that follows the button is a `
                + 'lamp, not a step.');
            seen.push(held);
        }
        // Divide-by-two: four presses give ON, OFF, ON, OFF, and the ON level is
        // the hand-computed 4.4643 V, not merely "something non-zero".
        assert.deepEqual(seen, [4.4643, 0, 4.4643, 0],
            '5 V behind R_OUT = 50 Ω into 220 Ω + a red LED settles at 10.714 mA, '
            + 'so Q sits 0.5357 V below the rail');
    });

    test('the 555 half is untouched by the repair', async () => {
        const c = await load();
        // The astable topology `machines-clocks` measures: threshold tied to
        // trigger, the RC pair, and the green LED on the output through r2.
        const thr = netWith(c.board, 'u1', 'threshold').terminals
            .map((x) => `${x.part}.${x.terminal}`).sort();
        assert.deepEqual(thr, ['c1.a', 'pot1.b', 'pot1.wiper', 'u1.threshold', 'u1.trigger'],
            'the timing node is unchanged');
        const out = netWith(c.board, 'u1', 'output').terminals
            .map((x) => `${x.part}.${x.terminal}`).sort();
        assert.deepEqual(out, ['r2.a', 'u1.output'], 'nothing new hangs off the oscillator output');
    });
});
