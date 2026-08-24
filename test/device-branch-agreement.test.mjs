/**
 * A device terminal current must equal the current in the branch it feeds.
 *
 * WHY THIS GATE EXISTS, AND WHAT THE DECLINE IT REPLACES GOT WRONG
 * ----------------------------------------------------------------
 * `test/helpers/claim-adjudicate.mjs` used to decline every transistor terminal
 * current with this reason:
 *
 *     solveMNA EXTRACTS these from the terminal voltages through the device's
 *     knee model rather than solving for them, and the result is not
 *     KCL-consistent (430 mA into a base on a bench drawing 2.8 mA)
 *
 * The observation was real. The diagnosis was not, and the difference matters
 * because the diagnosis is what a later reader acts on. Measured on bw-board
 * 88e9668 — the revision the decline was written against — a device's OWN
 * terminal currents summed to zero to machine precision in 11 of 11 samples,
 * worst relative residual 0.0000 %. KCL at the device always held.
 *
 * What did not hold was agreement with the NETWORK. A saturated collector
 * reported the beta*I_B its VCCS demanded rather than what the external branch
 * could carry, so pc32-pnp-high-side read 43 A through a collector wired to a
 * resistor carrying 2.772 mA. The invariant that discriminates is therefore a
 * device terminal against the branch it feeds — and, being convention-free, it
 * is checked as a MAGNITUDE across a net with exactly two terminals, so no
 * assumption about the engine's sign convention can make it pass or fail.
 *
 * WHAT IT MEASURED, ACROSS FOUR REVISIONS
 * ---------------------------------------
 * 14 benches declare a BJT or a MOSFET. At two operating points they present 27
 * two-terminal nets touching such a device and carrying more than 1 µA. The
 * number of those nets whose two terminals disagree:
 *
 *   88e9668  20 of 27   the revision pinned while the decline stood
 *   20283ab   7 of 27   saturated collector gets its own extraction arm
 *   b5c02b1   4 of 27   stampPNP's early return no longer skips the E-B junction
 *   a301937   3 of 27   a buzzer's branch current becomes extractable
 *
 * so the decline stopped being true in three stages rather than the two the
 * hand-over recorded: 44-darlington-motor's collector still disagreed with the
 * buzzer it drives at b5c02b1 (47.9520 mA against 0.0000 mA) and only a301937
 * closed it.
 *
 * THE THREE THAT REMAIN ARE ONE CLASS AND NOT A TRANSISTOR DEFECT
 * ---------------------------------------------------------------
 * All three are a `gnd` part reporting 0 A through its terminal while an
 * emitter on the same net carries several milliamps. That is a device model
 * with no current readback — the same class as the relay coil in
 * pc38-relay-changeover — and it is bw-engine's `device KCL-visibility` lane.
 * This gate therefore asserts the SHAPE of what is left, not just a count: a
 * disagreement is tolerated only where one side is a part the engine reports no
 * current for at all. Two parts that both report a current may never disagree.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { exampleDirs, allClaims, EXAMPLES } from './helpers/expected-claims.mjs';
import { loadEngine, solveBench } from './helpers/bench-measure.mjs';
import { route } from './helpers/claim-router.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the device/branch current agreement checks');
const SKIP = gate.skip || false;

/** The three-terminal kinds whose currents solveMNA extracts rather than solves. */
const DEVICE = new Set(['npn', 'pnp', 'nmos', 'pmos']);
/** Below this both sides of a comparison are numerical noise, not a reading. */
const FLOOR = 1e-6;
const POINTS = [{}, { controls: { button: 1, __pins: 'high' } }];

function deviceBenches () {
    return exampleDirs().filter(d => {
        const p = join(EXAMPLES, d, 'circuit.json');
        if (!existsSync(p)) return false;
        try { return (JSON.parse(readFileSync(p, 'utf8')).parts || []).some(x => DEVICE.has(x.kind)); }
        catch { return false; }
    });
}

/** Every two-terminal net touching a BJT/FET, with both terminal currents. */
function samples () {
    const out = [];
    for (const dir of deviceBenches()) {
        for (const at of POINTS) {
            const s = solveBench(dir, at);
            if (s.error || !s.current || !s.nets) continue;
            const kindOf = new Map((s.parts || []).map(p => [p.id, p.kind]));
            for (const net of s.nets) {
                const terms = net.terminals || [];
                if (terms.length !== 2) continue;
                if (!terms.some(t => DEVICE.has(kindOf.get(t.part)))) continue;
                const [a, b] = terms.map(t => s.current.get(`${t.part}.${t.terminal}`));
                if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
                const mag = Math.max(Math.abs(a), Math.abs(b));
                if (mag < FLOOR) continue;
                // A part is SILENT when the engine reports no current through
                // any of its terminals on this bench — the gnd case. Read from
                // the solve rather than from a list of kinds, so a model that
                // grows a readback is recognised without editing this file.
                const silent = terms.map(t => {
                    const ts = [...s.current.keys()].filter(k => k.startsWith(`${t.part}.`));
                    return ts.length > 0 && ts.every(k => Math.abs(s.current.get(k)) < FLOOR);
                });
                out.push({
                    dir, net: net.id || net.name, at: JSON.stringify(at.controls || {}),
                    rel: Math.abs(Math.abs(a) - Math.abs(b)) / mag,
                    silentSide: silent.some(Boolean),
                    detail: terms.map((t, i) => `${t.part}.${t.terminal}=${([a, b][i] * 1000).toFixed(4)} mA`).join(' vs '),
                });
            }
        }
    }
    return out;
}

describe('a device terminal current equals the branch it feeds', { skip: SKIP }, () => {
    test('the population is the one this gate was measured over', async () => {
        await loadEngine(gate.paths);
        const benches = deviceBenches();
        assert.ok(benches.length >= 14,
            `only ${benches.length} benches declare a BJT or a MOSFET — this gate has lost its subject`);
        const s = samples();
        assert.ok(s.length >= 27,
            `only ${s.length} device-touching two-terminal nets carry more than ${FLOOR * 1e3} mA — `
            + 'the extractor or the netlist reader has changed under this gate');
    });

    test('no disagreement between two parts that both report a current', async () => {
        await loadEngine(gate.paths);
        const bad = samples()
            .filter(x => x.rel > 1e-6 && !x.silentSide)
            .map(x => `${x.dir} ${x.net} at ${x.at || '{}'}: ${(x.rel * 100).toFixed(2)} % — ${x.detail}`);
        // This is the assertion the deleted decline should have been. On
        // bw-board 88e9668 it fails 17 times; on a301937 it must not fail at
        // all, because every surviving disagreement has a silent part on one
        // side and is counted by the next test instead.
        assert.deepEqual(bad, [],
            'a transistor or FET terminal disagrees with the branch it feeds, and neither side is silent — '
            + 'solveMNA is extracting a current the external network cannot carry, which is the defect '
            + 'that made pc32-pnp-high-side read 43 A through a 2.772 mA resistor');
    });

    test('what is left is a part with no current readback, and it only shrinks', async () => {
        await loadEngine(gate.paths);
        const left = samples().filter(x => x.rel > 1e-6);
        for (const x of left)
            assert.ok(x.silentSide, `${x.dir} ${x.net}: disagreement with no silent side — ${x.detail}`);
        // A RATCHET WITH A NAMED OWNER. 3 on bw-board a301937, all of them a
        // `gnd` part reading 0 A against an emitter carrying several mA.
        // bw-engine's `device KCL-visibility` lane makes every stamping model
        // KCL-visible; when that lands and the pin moves, this number drops and
        // this line is what says so.
        assert.ok(left.length <= 3,
            `${left.length} device/branch disagreements against a recorded 3:\n  ` +
            left.map(x => `${x.dir} ${x.net} — ${x.detail}`).join('\n  '));
    });
});

describe('a bench that drops volts and reports no current', { skip: SKIP }, () => {
    test('the two benches the adjudicator declines for are still the subject', async () => {
        await loadEngine(gate.paths);
        // The population is the benches a current claim actually routes to,
        // because that is where the decline can matter — and because solving
        // the whole corpus at an arbitrary operating point takes minutes.
        const reached = new Map();
        for (const c of allClaims()) {
            if (c.cls !== 'curr') continue;
            const r = route(c);
            if (r.decline) continue;
            for (const p of (r.point ? [r.point] : r.points)) {
                if (!reached.has(c.dir)) reached.set(c.dir, []);
                reached.get(c.dir).push(p);
            }
        }
        const dead = [];
        for (const [dir, pts] of reached) {
            let live = false, dropping = false;
            for (const p of pts.slice(0, 6)) {
                const s = solveBench(dir, p);
                if (s.error) continue;
                if ([...s.current.values()].some(i => Math.abs(i) > 1e-6)) live = true;
                if (s.measurands.some(m => m.kind === 'drop' && m.si > 0.1)) dropping = true;
            }
            if (!live && dropping) dead.push(dir);
        }
        assert.ok(reached.size >= 69,
            `only ${reached.size} benches are reached by a current claim — the router has changed under this gate`);
        // 2 of 69 on bw-board a301937. Named, because a decline whose subject
        // has silently disappeared is a rule that reads as load-bearing and is
        // not — and because when the KCL-visibility lane lands, this list is
        // where it shows up.
        assert.deepEqual(dead.sort(), ['168p01-blink', 'avr01-blink'],
            'the set of benches that solve for volts and report no current at all has changed. '
            + 'Growing means a new bench lost its readback; shrinking is good news and means the '
            + 'decline in claim-adjudicate.mjs ("every branch current on it reads exactly 0 A") '
            + 'has lost a subject and its claims should be re-derived rather than left declined.');
    });
});
