// Circuit-preserving retarget: a device pick on an example WITH an
// authored circuit transforms that circuit — it must NOT be replaced by
// a synthesized generic bench (the retargetter once swapped the whole
// console for a rank of LEDs; owner report 2026-08-17).
//
// These are assertions on the SHIPPED bench files, because the files are
// what the app loads: every non-MCU part byte-identical to the authored
// circuit, the MCU swapped to the target's designer kind, connectivity
// re-expressed per retarget's pinMap. Generated seating may legitimately
// change positions and seats while preserving that electrical identity.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

const CASES = [
    // [example, authored MCU kind, device, target kind]. Only devices the
    // example actually OFFERS: the retro console's 27 pins exceed the
    // stc12 pools, so its list is [stc15f2k60s2, arduino-mega] — an
    // honest retarget refusal, not a transform gap.
    ['61-console-pong', 'stc15_mcu', 'stc12c5a60s2', 'mcu'],
    ['61-console-pong', 'stc15_mcu', 'arduino-mega', 'arduino_mega'],
    ['60-retro-console', 'stc15_mcu', 'arduino-mega', 'arduino_mega'],
];

describe('authored-circuit transform: the console survives a device pick', () => {
    for (const [id, authoredKind, device, targetKind] of CASES) {
        test(`${id} -> ${device}: same parts, only the MCU differs`, () => {
            const authored = JSON.parse(
                readFileSync(join(EXAMPLES, id, 'circuit.json'), 'utf8'));
            const benchPath = join(EXAMPLES, id, `circuit.${device}.json`);
            assert.ok(existsSync(benchPath), `${device} bench exists`);
            const bench = JSON.parse(readFileSync(benchPath, 'utf8'));
            assert.match(bench.generated, /^benchFor\+authored(?:\+seat)?$/,
                'marked as a transform, not a synthesis');

            // Part census: identical except the MCU kind swap.
            const census = (parts) => {
                const m = {};
                for (const p of parts) {
                    if (p.kind === 'breadboard') continue; // regenerated substrate, not a peripheral
                    m[p.kind] = (m[p.kind] || 0) + 1;
                }
                return m;
            };
            const ca = census(authored.parts);
            const cb = census(bench.parts);
            assert.equal(ca[authoredKind], 1);
            assert.equal(cb[targetKind], 1);
            delete ca[authoredKind];
            delete cb[targetKind];
            assert.deepEqual(cb, ca, 'every peripheral survives the pick');

            // Every non-MCU part is electrically identical. The seating pass
            // is allowed to replace x/y and seat because it re-packs the real
            // footprint onto a collision-free breadboard.
            const electricalShape = ({x, y, seat, ...part}) => part;
            const aById = new Map(authored.parts
                .filter((p) => p.kind !== authoredKind && p.kind !== 'breadboard')
                .map((p) => [p.id, electricalShape(p)]));
            for (const p of bench.parts) {
                if (p.kind === targetKind || p.kind === 'breadboard') continue;
                assert.deepEqual(electricalShape(p), aById.get(p.id),
                    `${p.id} keeps its authored electrical identity`);
            }

            // A board without a breadboard footprint floats; a package with
            // one is deliberately reseated. In either case the authored seat
            // for a different footprint is never reused.
            const mcu = bench.parts.find((p) => p.kind === targetKind);
            if (targetKind === 'arduino_mega') assert.ok(!mcu.seat, 'Mega floats beside the bench');
            else assert.ok(mcu.seat, 'breadboard MCU is reseated to its own footprint');
        });
    }

    test('the authored device gets NO generated bench — the app loads the authored circuit', () => {
        assert.ok(!existsSync(join(EXAMPLES, '61-console-pong', 'circuit.stc15f2k60s2.json')),
            'a generated file for the authored device could only disagree');
    });
});
