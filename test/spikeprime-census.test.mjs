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
        assert.equal(Object.keys(canonical).length, 84,
            'counted 84 opcodes from the pinned canonical getInfo surface on 2026-08-31');
    });

    test('all 84 canonical opcodes are mapped or explicitly classified exactly once', () => {
        const accounted = [...SPIKE_DIALECT_OPS, ...excluded];
        assert.equal(new Set(accounted).size, accounted.length, 'duplicate opcode in dialect ledger');
        assert.deepEqual(accounted.sort(), Object.keys(canonical).sort());
        assert.equal(SPIKE_DIALECT_OPS.length, 30,
            'counted 30 bidirectional dialect mappings on 2026-08-31');
        assert.deepEqual(Object.fromEntries(Object.entries(SPIKE_DIALECT_EXCLUSIONS)
            .map(([kind, ops]) => [kind, ops.length])), {
            'host-control': 21, 'event-hat': 4, 'learner-gap': 29
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
