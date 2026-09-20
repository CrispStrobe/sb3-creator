import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RUNTIME_EXTENSIONS, RUNTIME_EXTENSION_SOURCES} from '../src/utils/runtimeRegistry.generated.js';
import {
    SPIKE_DIALECT_OPS,
    SPIKE_DIALECT_EXCLUSIONS,
    SPIKE_DIALECT_EXCLUSION_REASONS
} from '../src/utils/spikeprimeDialect.js';

const compiler = readFileSync(new URL('../src/utils/sb3Creator.js', import.meta.url), 'utf8');
const canonical = RUNTIME_EXTENSIONS.spikeprime.ops;
const excluded = Object.values(SPIKE_DIALECT_EXCLUSIONS).flat();

describe('canonical SPIKE dialect census', () => {
    test('the source is immutable, named and non-empty', () => {
        assert.equal(RUNTIME_EXTENSION_SOURCES.repo, 'CrispStrobe/extensions');
        assert.match(RUNTIME_EXTENSION_SOURCES.commit, /^[0-9a-f]{40}$/);
        const source = RUNTIME_EXTENSION_SOURCES.slugs['CrispStrobe/legospike_turbowarp_transpile'];
        assert.match(source.from, new RegExp(RUNTIME_EXTENSION_SOURCES.commit));
        assert.match(source.sha256, /^[0-9a-f]{64}$/);
        assert.equal(Object.keys(canonical).length, 101,
            'counted 101 opcodes from the pinned canonical getInfo surface on 2026-09-20; ' +
            'it was 84 until upstream consolidated the four SPIKE Prime extensions into one ' +
            'that discovers the hub firmware and picks the protocol at runtime');
    });

    test('all 101 canonical opcodes are mapped or explicitly classified exactly once', () => {
        const accounted = [...SPIKE_DIALECT_OPS, ...excluded];
        assert.equal(new Set(accounted).size, accounted.length, 'duplicate opcode in dialect ledger');
        assert.deepEqual(accounted.sort(), Object.keys(canonical).sort());
        // The mapped set is asserted to be UNCHANGED across the consolidation.
        // That is the load-bearing half of this test: 17 opcodes arriving could
        // be absorbed by quietly mapping a few and calling the slice wider, and
        // the union check alone would still pass. It did not widen — every new
        // opcode landed in an exclusion class, and the classes say why.
        assert.equal(SPIKE_DIALECT_OPS.length, 30,
            'counted 30 bidirectional dialect mappings on 2026-08-31, unchanged on 2026-09-20');
        assert.deepEqual(Object.fromEntries(Object.entries(SPIKE_DIALECT_EXCLUSIONS)
            .map(([kind, ops]) => [kind, ops.length])), {
            // +10 transport-control and +7 learner-gap on 2026-09-20 = the 17
            // opcodes the unified extension brought. host-control and event-hat
            // are untouched, which is the check that the new connection blocks
            // were not swept into the editor/REPL class to avoid naming them.
            'host-control': 21, 'transport-control': 10, 'event-hat': 4, 'learner-gap': 36
        });
    });

    test('every mapped opcode has forward and reverse compiler references', () => {
        for (const opcode of SPIKE_DIALECT_OPS) {
            const occurrences = compiler.match(new RegExp(`['"]spikeprime_${opcode}['"]`, 'g')) || [];
            assert.ok(occurrences.length >= 2,
                `${opcode}: counted 2 required references (forward and reverse), saw ${occurrences.length}`);
        }
    });

    test('every exclusion class carries a reason and only real canonical opcodes', () => {
        for (const [kind, ops] of Object.entries(SPIKE_DIALECT_EXCLUSIONS)) {
            assert.ok(SPIKE_DIALECT_EXCLUSION_REASONS[kind]?.length > 0, `${kind}: missing reason`);
            for (const opcode of ops) assert.ok(canonical[opcode], `${kind}: unknown opcode ${opcode}`);
        }
    });
});
