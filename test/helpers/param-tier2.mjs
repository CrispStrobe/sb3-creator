/**
 * Tier 2 of the circuit-params-are-read gate, as one shard of the sweep.
 *
 * WHY SHARDS
 * ----------
 * node --test runs test FILES in parallel and the tests inside one file in
 * series. The sweep grew past 290 (kind, key) pairs, and the RF and optics
 * benches among them cost seconds of CPU per simulated millisecond, so the
 * single file ran into CI's per-file --test-timeout of 900 s (main run
 * 45767796535, 2026-11-26) and took the whole step past its 30 minutes with
 * it. Each file test/circuit-params-are-read*.test.mjs now probes the pairs
 * whose index in the sorted list is `shard` modulo `of`: same pairs, same
 * sites, same verdicts, in parallel. The ratchet stays one list
 * (param-known-inert.mjs), and every shard holds its own pairs to it.
 *
 * Adding a shard means adding a file and raising SHARDS below; a pair is then
 * probed by exactly one file. The main file asserts the shard files exist,
 * so a deleted shard cannot silently drop a quarter of the pairs.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { requireSiblings, siblingGuardTest } from './siblings.mjs';
import { injectEngine } from '../../scripts/lib/engine-surface.mjs';
import { declaredParams, makeObserver, probeKeys, rank, loadCardiacPanel } from './param-probe.mjs';
import { KNOWN_INERT } from './param-known-inert.mjs';

export const SHARDS = 4;

/**
 * The (kind, key) pairs shard `shard` (0-based) probes.
 *
 * Pairs are grouped by the bench file probed FIRST for them (rank order),
 * and the groups dealt round-robin: the base observation of a bench is
 * cached per process, so a bench's pairs split across shards paid for its
 * base once per shard (MEASURED 2026-11-26 on CI with the pairs dealt one by
 * one: 4 shards, 150-267 s each).
 */
export function shardIds (sites, shard, of = SHARDS) {
    const groups = new Map();
    for (const id of [...sites.keys()].sort()) {
        const first = [...sites.get(id)].sort((a, b) => rank(a) - rank(b))[0];
        const key = first ? `${first.dir}/${first.file}` : '';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(id);
    }
    return [...groups.keys()].sort()
        .filter((_, i) => i % of === shard)
        .flatMap(k => groups.get(k));
}

export function defineTier2 (shard) {
    const gate = requireSiblings('bw-board', 'bw-circuit-ui');
    siblingGuardTest(gate, `the circuit-params-are-read gate, tier 2 shard ${shard + 1}/${SHARDS}`);
    const SKIP = gate.skip || false;

    describe(`circuit params, tier 2 (shard ${shard + 1}/${SHARDS}): the key moves a real bench`, { skip: SKIP }, () => {
        let observe = null;
        const { sites } = declaredParams();
        const ids = shardIds(sites, shard);
        const exempt = ids.filter(id => KNOWN_INERT.has(id)).length;

        test('the engine loads', async () => {
            const eng = await injectEngine({ board: gate.paths['bw-board'], cui: gate.paths['bw-circuit-ui'] });
            // cardiac.inputSource is owned by the compact panel, not the engine:
            // only the shard that probes it renders the pinned CardiacPanel.
            const CardiacPanel = ids.includes('cardiac.inputSource')
                ? await loadCardiacPanel(gate.paths['bw-circuit-ui']) : null;
            observe = makeObserver({
                CardiacPanel,
                Circuit: eng.Circuit,
                getDevice: eng.board.getDevice,
                extractors: {
                    extractCp1Machine: eng.board.extractCp1Machine,
                    extract6502Machine: eng.surface.extract6502Machine,
                    extractZ80Machine: eng.surface.extractZ80Machine,
                },
            });
            assert.ok(eng.Circuit, 'bw-circuit-ui Circuit loaded');
        });

        test(`every declared (kind, key) in this shard changes something in some bench (${ids.length} pairs, ${exempt} exempt in KNOWN_INERT)`, () => {
            assert.ok(observe, 'engine did not load');
            // MEASURED 2026-11-26: 296 pairs over 4 shards, 60-90 each.
            assert.ok(ids.length >= 30, `only ${ids.length} pairs in this shard — the scan or the partition is broken`);
            const { inert, unprobeable, healed } = probeKeys(ids, sites, observe, KNOWN_INERT);
            assert.deepEqual(unprobeable, [], 'these (kind, key) pairs have no solvable bench at all');
            assert.deepEqual(inert.sort(), [],
                'Perturbing these params changed nothing observable in any bench that declares them. '
                + 'Either the engine ignores the key on this kind (fix the circuit or the engine), or '
                + 'no bench exercises it (add one). An entry may only be added to KNOWN_INERT with a '
                + 'written verdict saying which of those it is.');
            assert.deepEqual(healed.sort(), [],
                'RATCHET: these KNOWN_INERT entries now move a real bench; remove their exemptions.');
        });
    });
}
