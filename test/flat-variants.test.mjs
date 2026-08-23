/**
 * Flat variants: same circuit, no breadboard.
 *
 * Every `circuit-flat.json` is a derived twin of the `circuit.json` beside it,
 * with the board removed and the connections it was making re-expressed as
 * explicit part-to-part wires. They exist because a "pure circuit" lesson is
 * easier to read without a breadboard under it, and because they were the
 * original form: 187 examples were seated onto boards in one generated commit
 * (b018bf0, "additive-visual"), and the flat form was never kept.
 *
 * They were NOT recovered from that commit. 846 of the breadboarded files were
 * seated by other commits or born seated, and of the 160 with a pre-image, 20
 * had been rewired since — so the historical copy is stale where it exists.
 * They are derived from today's circuit and verified against it.
 *
 * THIS GATE CHECKS THE RELATIONSHIP, which is the part that can rot: a flat
 * twin must carry no board and must resolve to the SAME net partition as its
 * original. Edit one and not the other, and this fails.
 *
 * Alias spellings are folded before comparing: the engine publishes `mcu1.D13`
 * and `mcu1.d13` for one physical leg, and treating them as two nodes reads as
 * a lost connection when it is a lost SPELLING.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

const SB3 = join(import.meta.dirname, '..');
const CUI = process.env.BW_CIRCUIT_UI || join(SB3, '..', 'bw-circuit-ui');
const BWB = process.env.BW_BOARD || join(SB3, '..', 'bw-board');
const EXAMPLES = join(SB3, 'examples');
// board.js, not index.js: index.js re-exports the same BoardImpl/inferNetlist
// but also pulls the avr8js adapter chain, so a bw-board checkout whose npm
// deps are not installed made this gate FAIL on an import rather than run —
// with both siblings present. The specific modules are what bw-circuit-ui's
// own test setup imports, and Node caches by resolved path, so they are the
// same module instances index.js would have handed back.
// Cross-repo guard: local skip, CI failure. See test/helpers/siblings.mjs
// and test/CROSS-REPO-GATE-AUDIT.md.
const gate = requireSiblings('bw-circuit-ui', 'bw-board');
siblingGuardTest(gate, 'the flat-variant net gate');
const available = !gate.skip;

/** Net partition over real terminals, alias-folded. */
function partition(c) {
  const sets = [];
  for (const n of (c.resolvedNets || [])) {
    const t = n.terminals
      .filter((x) => typeof x.part === 'string' && !x.part.startsWith('@bb:'))
      .map((x) => (x.part + '.' + x.terminal).toLowerCase());
    const uniq = [...new Set(t)].sort();
    if (uniq.length > 1) sets.push(uniq.join('|'));
  }
  return sets.sort().join('\n');
}

describe('flat variants match their breadboarded twin',
  { skip: gate.skip }, () => {
    let Circuit;
    const pairs = [];

    test('engine + sidecars load, and the pairs are found', async () => {
      const { setEngine } = await import(join(CUI, 'src/engine.js'));
      const { BoardImpl } = await import(join(BWB, 'src/board.js'));
      const { inferNetlist, checkWiring } = await import(join(BWB, 'src/infer-netlist.js'));
      const { hasDevice, getDevice } = await import(join(BWB, 'src/devices.js'));
      (await import(join(BWB, 'src/register-all.js'))).registerAllDevices();
      setEngine({ BoardImpl, inferNetlist, checkWiring, hasDevice, getDevice });
      const { registerSidecar } = await import(join(CUI, 'src/model/parts-registry.js'));
      for (const f of readdirSync(join(CUI, 'src/parts-data'))) {
        if (!f.endsWith('.json')) continue;
        try {
          const sc = JSON.parse(readFileSync(join(CUI, 'src/parts-data', f), 'utf8'));
          if (sc.kind) registerSidecar(sc);
        } catch { /* bw-parts' problem */ }
      }
      ({ Circuit } = await import(join(CUI, 'src/model/circuit.js')));

      for (const d of readdirSync(EXAMPLES, { withFileTypes: true })) {
        if (!d.isDirectory()) continue;
        for (const fn of readdirSync(join(EXAMPLES, d.name))) {
          if (!fn.startsWith('circuit-flat')) continue;
          const twin = fn === 'circuit-flat.json' ? 'circuit.json'
            : 'circuit.' + fn.slice('circuit-flat.'.length);
          pairs.push({ dir: d.name, flat: fn, twin });
        }
      }
      // Vacuity guard: if the naming changes or the files go, this must fail
      // rather than pass over an empty list.
      assert.ok(pairs.length > 900,
        `only ${pairs.length} flat variants found — expected one per breadboarded circuit`);
    });

    test('every flat variant is board-free and electrically identical', () => {
      // The pair list is built by the test above. If that one failed, this one
      // would otherwise loop over an empty array and PASS — observed 2026-08-23,
      // when the engine import threw and this still reported ok.
      assert.ok(pairs.length > 900,
        `pair list is ${pairs.length} — the loader test did not run or did not finish, `
        + 'so this gate would be asserting over nothing');
      assert.ok(Circuit, 'Circuit was never loaded — see the loader test');
      const problems = [];
      for (const { dir, flat, twin } of pairs) {
        const tp = join(EXAMPLES, dir, twin);
        if (!existsSync(tp)) { problems.push(`${dir}/${flat}: no twin ${twin}`); continue; }
        const load = (p) => { const j = JSON.parse(readFileSync(p, 'utf8')); return j.circuit || j; };
        const rawFlat = load(join(EXAMPLES, dir, flat));
        const rawTwin = load(tp);
        if (rawFlat.parts.some((p) => p.kind === 'breadboard')) {
          problems.push(`${dir}/${flat}: still has a breadboard`); continue;
        }
        let a, b;
        try { a = Circuit.fromJSON(rawTwin); b = Circuit.fromJSON(rawFlat); }
        catch (e) { problems.push(`${dir}/${flat}: ${e.message.slice(0, 60)}`); continue; }
        if (partition(a) !== partition(b)) {
          problems.push(`${dir}/${flat}: net partition differs from ${twin}`);
        }
      }
      assert.deepEqual(problems.slice(0, 20), [],
        `${problems.length} flat variant(s) drifted from their twin:\n  `
        + problems.slice(0, 20).join('\n  '));
    });
  });
