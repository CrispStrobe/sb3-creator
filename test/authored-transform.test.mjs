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
import { alignAuthoredBenchPolarity, parseRetargetedPins } from '../scripts/lib/authored-transform.mjs';

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

const circuitFixture = (data, nets) => {
    let first = true;
    return {fromJSON: doc => {
        if (first) {
            first = false;
            assert.deepEqual(doc, data, 'the transform measures the authored circuit first');
        }
        return {netlistError: null, resolvedNets: nets};
    }};
};

test('a polarity rewrite reverses only its LED branch, not its active-high neighbour', () => {
    const data = {
        vcc: 5,
        parts: [
            {id: 'cpu', kind: 'arduino_uno', params: {}},
            {id: 'rLow', kind: 'resistor', params: {ohms: 1000}, terminals: ['a', 'b'],
                seat: {boardId: 'bb', leadMap: {a: 'a3', b: 'a7'}}},
            {id: 'ledLow', kind: 'led', params: {}, terminals: ['anode', 'cathode'],
                seat: {boardId: 'bb', leadMap: {anode: 'a15', cathode: 'a16'}}},
            {id: 'rHigh', kind: 'resistor', params: {ohms: 1000}, terminals: ['a', 'b']},
            {id: 'ledHigh', kind: 'led', params: {}, terminals: ['anode', 'cathode']},
            {id: 'supply', kind: 'vcc', params: {}, terminals: ['vcc']},
            {id: 'ground', kind: 'gnd', params: {}, terminals: ['gnd']}
        ],
        wires: [
            {from: 'cpu', fromTerminal: 'd13', to: 'ledLow', toTerminal: 'cathode'},
            {from: 'ledLow', fromTerminal: 'anode', to: 'rLow', toTerminal: 'b'},
            {from: 'rLow', fromTerminal: 'a', to: 'supply', toTerminal: 'vcc'},
            {from: 'cpu', fromTerminal: 'd12', to: 'rHigh', toTerminal: 'a'},
            {from: 'rHigh', fromTerminal: 'b', to: 'ledHigh', toTerminal: 'anode'},
            {from: 'ledHigh', fromTerminal: 'cathode', to: 'ground', toTerminal: 'gnd'}
        ],
        holeWires: [
            {ref: 'pin-jumper', boardId: 'bb', a: 'b16', b: 'j30', color: 'green'},
            {ref: 'rail-jumper', boardId: 'bb', a: 'b3', b: 't+3', color: 'red'}
        ]
    };
    const nets = [
        {id: 'low-pin', terminals: [{part: 'cpu', terminal: 'd13'}, {part: 'ledLow', terminal: 'cathode'}]},
        {id: 'low-mid', terminals: [{part: 'ledLow', terminal: 'anode'}, {part: 'rLow', terminal: 'b'}]},
        {id: 'low-rail', terminals: [{part: 'rLow', terminal: 'a'}, {part: 'supply', terminal: 'vcc'}]},
        {id: 'high-pin', terminals: [{part: 'cpu', terminal: 'd12'}, {part: 'rHigh', terminal: 'a'}]},
        {id: 'high-mid', terminals: [{part: 'rHigh', terminal: 'b'}, {part: 'ledHigh', terminal: 'anode'}]},
        {id: 'high-rail', terminals: [{part: 'ledHigh', terminal: 'cathode'}, {part: 'ground', terminal: 'gnd'}]}
    ];
    const result = alignAuthoredBenchPolarity(data, circuitFixture(data, nets), [
        {name: 'low', where: 'D13', direction: 'output', activeLow: false},
        {name: 'high', where: 'D12', direction: 'output', activeLow: false}
    ]);
    assert.equal(result.ok, true, result.reason);
    assert.deepEqual(result.out.parts, data.parts, 'polarity alignment preserves every part and seat');
    assert.deepEqual(result.out.holeWires, [
        {ref: 'pin-jumper', boardId: 'bb', a: 'a3', b: 'j30', color: 'green'},
        {ref: 'rail-jumper', boardId: 'bb', a: 'a16', b: 't+3', color: 'red'}
    ], 'physical jumper external ends survive while their branch ends swap');
    const wires = result.out.wires.map(w =>
        `${w['from']}.${w['fromTerminal']}->${w['to']}.${w['toTerminal']}`);
    const connects = (a, b) => wires.includes(`${a}->${b}`) || wires.includes(`${b}->${a}`);
    assert.ok(wires.includes('cpu.d13->rLow.a'), 'mapped pin takes the old rail end');
    assert.ok(wires.includes('ground.gnd->ledLow.cathode'), 'opposite rail takes the old pin end');
    assert.ok(connects('rLow.b', 'ledLow.anode'), 'series interior survives');
    assert.ok(wires.includes('cpu.d12->rHigh.a'), 'unchanged neighbour keeps its own mapped pin');
    assert.ok(wires.includes('ledHigh.cathode->ground.gnd'), 'unchanged neighbour keeps its rail');
    assert.equal(wires.some(w => /supply\.vcc->rLow\.a|rLow\.a->supply\.vcc/.test(w)), false,
        'old active-low rail connection is gone');

    const sharedNets = structuredClone(nets);
    sharedNets[1].terminals.push({part: 'probe', terminal: 'in'});
    const refused = alignAuthoredBenchPolarity(data, circuitFixture(data, sharedNets), [
        {name: 'low', where: 'D13', direction: 'output', activeLow: false}
    ]);
    assert.equal(refused.ok, false, 'a shared branch must not be silently re-authored');
    assert.match(refused.reason, /shared branch/);

    const missingMetadata = alignAuthoredBenchPolarity(data, circuitFixture(data, nets));
    assert.equal(missingMetadata.ok, false, 'missing polarity metadata must fail closed');
    assert.match(missingMetadata.reason, /missing retargeted pin metadata/);

    const noGround = {...data, parts: data.parts.filter(part => part.kind !== 'gnd')};
    const missingRail = alignAuthoredBenchPolarity(noGround, circuitFixture(noGround, nets), [
        {name: 'low', where: 'D13', direction: 'output', activeLow: false}
    ]);
    assert.equal(missingRail.ok, false, 'a reversal without its required rail must fail closed');
    assert.match(missingRail.reason, /requires a gnd part/);
});

test('generation and device-list dry runs share the fail-closed pin parser', () => {
    class Creator {
        parse (text) { this.project = text === 'pins' ? {stc: {pins: [{where: 'D13'}]}} : {}; }
    }
    assert.deepEqual(parseRetargetedPins(Creator, 'pins'), {ok: true, pins: [{where: 'D13'}]});
    assert.equal(parseRetargetedPins(Creator, 'missing').ok, false);
    for (const file of ['../scripts/gen-device-benches.mjs', '../scripts/update-example-devices.mjs']) {
        const source = readFileSync(join(import.meta.dirname, file), 'utf8');
        assert.match(source, /parseRetargetedPins\(SB3Creator,/,
            `${file} must use the shared pin parser before its authored transform`);
        assert.match(source, /transformAuthored\([\s\S]{0,300}parsed\.pins\)/,
            `${file} must pass the parsed pins to the authored transform`);
    }
});

test('an Arduino active-high branch becomes a sinking 8051 branch', () => {
    const data = {
        vcc: 5,
        parts: [
            {id: 'cpu', kind: 'mcu', params: {}},
            {id: 'r1', kind: 'resistor', params: {ohms: 1000}, terminals: ['a', 'b']},
            {id: 'led1', kind: 'led', params: {}, terminals: ['anode', 'cathode']},
            {id: 'supply', kind: 'vcc', params: {}, terminals: ['vcc']},
            {id: 'ground', kind: 'gnd', params: {}, terminals: ['gnd']}
        ],
        wires: [
            {from: 'cpu', fromTerminal: 'P1.0', to: 'r1', toTerminal: 'a'},
            {from: 'r1', fromTerminal: 'b', to: 'led1', toTerminal: 'anode'},
            {from: 'led1', fromTerminal: 'cathode', to: 'ground', toTerminal: 'gnd'}
        ],
        holeWires: []
    };
    const nets = [
        {id: 'pin', terminals: [{part: 'cpu', terminal: 'P1.0'}, {part: 'r1', terminal: 'a'}]},
        {id: 'mid', terminals: [{part: 'r1', terminal: 'b'}, {part: 'led1', terminal: 'anode'}]},
        {id: 'rail', terminals: [{part: 'led1', terminal: 'cathode'}, {part: 'ground', terminal: 'gnd'}]}
    ];
    const result = alignAuthoredBenchPolarity(data, circuitFixture(data, nets), [
            {name: 'led', port: 1, bit: 0, direction: 'output', activeLow: true}
        ]);
    assert.equal(result.ok, true, result.reason);
    const wires = result.out.wires.map(w =>
        `${w['from']}.${w['fromTerminal']}->${w['to']}.${w['toTerminal']}`);
    const connects = (a, b) => wires.includes(`${a}->${b}`) || wires.includes(`${b}->${a}`);
    assert.ok(wires.includes('cpu.P1.0->led1.cathode'), 'mapped 8051 pin takes the cathode end');
    assert.ok(wires.includes('supply.vcc->r1.a'), 'VCC takes the resistor end');
    assert.ok(connects('r1.b', 'led1.anode'), 'series interior survives');
    assert.equal(wires.some(w => /led1\.cathode->ground\.gnd|ground\.gnd->led1\.cathode/.test(w)), false,
        'old active-high rail connection is gone');
});

// ── every DEVPART kind needs a power/ground mapping ──────────────────────

test('every DEVPART target kind has a POWER_EQUIV row', async () => {
    // `transformAuthored` does `const equiv = POWER_EQUIV[targetKind]` and then
    // dereferences `equiv.power` / `equiv.ground` unguarded. A device family
    // added to DEVPART without a row here therefore does not degrade — it
    // throws `Cannot read properties of undefined (reading 'ground')` on the
    // first authored circuit reached, which is how `stm32f030` stopped
    // `scripts/update-example-devices.mjs` from running AT ALL on main. That
    // script is the only way to regenerate the gallery's `devices` lists, so
    // the whole device-family workflow was blocked by one absent line, and
    // nothing failed until someone ran it.
    //
    // Asserted as a set relationship rather than a list of names, so adding a
    // device to DEVPART fails HERE — cheaply, by name — instead of crashing a
    // script somebody runs months later.
    const {DEVPART} = await import('../scripts/lib/devpart.mjs');
    const src = readFileSync(join(import.meta.dirname, '..', 'scripts', 'lib',
        'authored-transform.mjs'), 'utf8');
    const block = src.slice(src.indexOf('const POWER_EQUIV = {'));
    const mapped = new Set(
        [...block.slice(0, block.indexOf('\n};')).matchAll(/^\s*([A-Za-z_][\w]*):\s*\{/gm)]
            .map((m) => m[1]));
    // A parse check, not a data check: it catches the regex silently matching
    // nothing, which would make the real assertion below pass vacuously.
    // MEASURED 2026-09-04: POWER_EQUIV holds 10 rows — mcu, stc_mcu, stc15_mcu,
    // arduino_uno, arduino_nano, arduino_mega, pi_pico, attiny88, attiny85 and
    // the stm32f030 added in this change. The floor is 9 so that deleting one
    // row does not break the parse check instead of the assertion that names it.
    assert.ok(mapped.size >= 9,
        `POWER_EQUIV parsed as ${mapped.size} rows, expected ~10 (MEASURED 2026-09-04) — ` +
        `the parse broke, not the data`);

    const missing = [...new Set(Object.values(DEVPART))].filter((kind) => !mapped.has(kind));
    assert.deepEqual(missing, [],
        `these DEVPART target kinds have no POWER_EQUIV row, so transformAuthored ` +
        `throws on the first authored circuit that reaches them: ${missing.join(', ')}`);
});
