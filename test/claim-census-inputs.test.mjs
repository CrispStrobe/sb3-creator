/**
 * The claim census can PUT a bench in the states its document names, for the
 * device-model inputs as well as for buttons, pots and supplies: a slide
 * switch's position, a DIP block's pattern, a Hall sensor's field, a reed
 * switch's magnet, and the light on a phototransistor, a photodiode or an LDR.
 *
 * Before test/helpers/bench-inputs.mjs the router had no channel for any of
 * these. A row "| +1 | 4.5 V |" under "| field | Hall output |" was held
 * against the bench as authored (field 0, 2.5 V) and reported as a mismatch, a
 * DIP row "| on | off | 5 mA |" was declined as "two switches in different
 * states", and a light level was read only as "bright"/"dark" on an LDR. Each
 * case below is a small bench built here, a few lines of EXPECTED.md about it,
 * and the verdict the census must reach — plus the MUTATED line, which must be
 * reported as a mismatch, so a pass cannot come from the input being ignored
 * and the enumeration happening to hit the number.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';
import { claimsOfText } from './helpers/expected-claims.mjs';
import { loadEngine, registerBench, solveBench } from './helpers/bench-measure.mjs';
import { adjudicate } from './helpers/claim-adjudicate.mjs';
import { route, enumerateStates } from './helpers/claim-router.mjs';
import {
    lightLevel, pairsOf, parseParamKey, paramKey, readInputs, inputStates, PARAM_INPUTS,
} from './helpers/bench-inputs.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the claim census input channels');
const SKIP = gate.skip || false;

const W = (from, fromTerminal, to, toTerminal) => ({ from, fromTerminal, to, toTerminal });
const RAIL = [{ id: 'vcc1', kind: 'vcc', params: { volts: 5 } }, { id: 'gnd1', kind: 'gnd', params: {} }];
const R = (id, ohms) => ({ id, kind: 'resistor', params: { ohms } });

/** Fixture benches, by name. Names start with `__` so no example can collide. */
const BENCH = {
    __hall: {
        vcc: 5,
        parts: [...RAIL, { id: 'hall', kind: 'hall_analog', params: {} }, R('r_load', 100000)],
        wires: [W('vcc1', 'vcc', 'hall', 'vcc'), W('gnd1', 'gnd', 'hall', 'gnd'),
            W('hall', 'ao', 'r_load', 'a'), W('r_load', 'b', 'gnd1', 'gnd')],
    },
    __slide: {
        vcc: 5,
        parts: [...RAIL, { id: 'sw', kind: 'slide_switch', params: { position: 0 } }, R('r1', 1000), R('r2', 2000)],
        wires: [W('vcc1', 'vcc', 'sw', 'com'), W('sw', 'a', 'r1', 'a'), W('r1', 'b', 'gnd1', 'gnd'),
            W('sw', 'b', 'r2', 'a'), W('r2', 'b', 'gnd1', 'gnd')],
    },
    __dip: {
        vcc: 5,
        parts: [...RAIL, { id: 'code', kind: 'dip_switch_spst', params: { switches: 0 } }, R('r1', 1000), R('r2', 2000)],
        wires: [W('vcc1', 'vcc', 'code', '1a'), W('vcc1', 'vcc', 'code', '2a'),
            W('code', '1b', 'r1', 'a'), W('r1', 'b', 'gnd1', 'gnd'),
            W('code', '2b', 'r2', 'a'), W('r2', 'b', 'gnd1', 'gnd')],
    },
    __photo: {
        vcc: 5,
        parts: [...RAIL, { id: 'pt', kind: 'phototransistor', params: { iMax: 0.002 } }, R('r_e', 1000)],
        wires: [W('vcc1', 'vcc', 'pt', 'collector'), W('pt', 'emitter', 'r_e', 'a'), W('r_e', 'b', 'gnd1', 'gnd')],
    },
    __photodiode: {
        vcc: 5,
        parts: [...RAIL, { id: 'pd', kind: 'photodiode', params: { iMax: 0.002 } }, R('r_a', 1000)],
        wires: [W('vcc1', 'vcc', 'pd', 'cathode'), W('pd', 'anode', 'r_a', 'a'), W('r_a', 'b', 'gnd1', 'gnd')],
    },
    __ldr: {
        vcc: 5,
        parts: [...RAIL, { id: 'ldr1', kind: 'ldr', params: { rDark: 100000, rLight: 1000 } }, R('r_bot', 10000)],
        wires: [W('vcc1', 'vcc', 'ldr1', 'a'), W('ldr1', 'b', 'r_bot', 'a'), W('r_bot', 'b', 'gnd1', 'gnd')],
    },
    __reed: {
        vcc: 5,
        parts: [...RAIL, { id: 'reed', kind: 'reed_switch', params: {} }, R('r1', 1000)],
        wires: [W('vcc1', 'vcc', 'reed', 'a'), W('reed', 'b', 'r1', 'a'), W('r1', 'b', 'gnd1', 'gnd')],
    },
};

/** Adjudicate every claim of a fixture page; returns {text -> verdict} in line order. */
function verdicts (dir, md) {
    return claimsOfText(dir, md).map(c => ({ claim: c, v: adjudicate(c), r: route(c) }));
}
const ok = (rows) => rows.filter(x => x.v.ok).map(x => x.claim.text);
const bad = (rows) => rows.filter(x => !x.v.ok && !x.v.skip).map(x => x.claim.text);

describe('reading the inputs a document names (no engine)', () => {
    test('a light level is a number, a percentage or a word', () => {
        assert.equal(lightLevel('0.8 (authored)'), 0.8);
        assert.equal(lightLevel('40 %'), 0.4);
        assert.equal(lightLevel('full'), 1);
        assert.equal(lightLevel('half (authored)'), 0.5);
        assert.equal(lightLevel('one tenth'), 0.1);
        assert.equal(lightLevel('dark'), 0);
        assert.equal(lightLevel('3'), null, 'a light of 3 is a reading in another unit, not a setting');
        assert.equal(lightLevel('dim'), null);
    });

    test('a table row sets the input its header names, and only that', () => {
        const hall = [{ id: 'hall', kind: 'hall_analog' }];
        assert.deepEqual(readInputs({ pairs: pairsOf('field slider = −0.5') }, hall).controls, { '@hall.field': -0.5 });
        assert.deepEqual(readInputs({ pairs: pairsOf('field slider = +0.5 (authored)') }, hall).controls, { '@hall.field': 0.5 });
        // The Hall OUTPUT column is a reading, not the field.
        assert.deepEqual(readInputs({ pairs: pairsOf('Hall output = 0.5 V') }, hall).controls, {});
        assert.deepEqual(readInputs({ pairs: pairsOf('field = 4.5') }, hall).controls, {}, 'outside the model range');

        const slide = [{ id: 'gain_sw', kind: 'slide_switch' }];
        assert.deepEqual(readInputs({ pairs: pairsOf('switch position = b') }, slide).controls, { '@gain_sw.position': 1 });
        assert.deepEqual(readInputs({ pairs: pairsOf('gain sw = a (authored)') }, slide).controls, { '@gain_sw.position': 0 });
        assert.deepEqual(readInputs({ pairs: pairsOf('switch = on') }, slide).controls, {}, 'an SPDT has no "on"');
        assert.deepEqual(readInputs({ prose: 'With the slide switch in position b, R_g is 100 Ω.' }, slide).controls, { '@gain_sw.position': 1 });
        assert.deepEqual(readInputs({ prose: 'In position a, R_g is 1 kΩ.' }, slide).controls, { '@gain_sw.position': 0 });
        assert.deepEqual(readInputs({ prose: 'Put in position a resistor of 1 kΩ.' }, slide).controls, {}, '"a" is the article here');

        const dip = [{ id: 'sw', kind: 'dip_switch_spst', params: { switches: 0 } }];
        const row = readInputs({ pairs: pairsOf('S1 = ON | S2 = off | S3 = ON | S4 = ON') }, dip);
        assert.deepEqual(row.controls, { '@sw.switches': 0b1101 });
        assert.equal(row.dipRow, true);
        assert.deepEqual(readInputs({ prose: 'With S1, S3 and S4 on the lock opens.' }, dip).controls, { '@sw.switches': 0b1101 });
        // Two DIP blocks: a bare "S1" does not say which.
        const two = [...dip, { id: 'sw2', kind: 'dip_switch_spst' }];
        assert.deepEqual(readInputs({ pairs: pairsOf('S1 = on | S2 = off') }, two).controls, {});

        const light = [{ id: 'pd', kind: 'photodiode' }, { id: 'ldr1', kind: 'ldr' }];
        assert.deepEqual(readInputs({ pairs: pairsOf('light on the sensor = half (authored)') }, light).controls,
            { '@pd.light': 0.5, ldr1: 0.5 });
        assert.deepEqual(readInputs({ pairs: pairsOf('light switch = off') }, light).controls, {}, 'a light SWITCH is not a light level');
        assert.deepEqual(readInputs({ prose: 'In complete darkness the output sits at 0 V.' }, light).controls, { '@pd.light': 0, ldr1: 0 });

        const reed = [{ id: 'reed', kind: 'reed_switch' }];
        assert.deepEqual(readInputs({ pairs: pairsOf('magnet = present') }, reed).controls, { '@reed.magnet': 1 });
    });

    test('a value the router already set is not overridden', () => {
        const ldr = [{ id: 'ldr1', kind: 'ldr' }];
        assert.deepEqual(readInputs({ pairs: pairsOf('light = full') }, ldr, { ldr1: 0.3 }).controls, {});
    });

    test('the states a bench can be put in cover every new input', () => {
        const states = inputStates([
            { id: 'a', kind: 'slide_switch' }, { id: 'b', kind: 'slide_switch' },
            { id: 'd', kind: 'dip_switch_spst' }, { id: 'h', kind: 'hall_analog' },
            { id: 'p', kind: 'phototransistor' }, { id: 'l', kind: 'light_sensor' },
        ]);
        const keys = (k) => states.filter(s => k in s.controls).map(s => s.controls[k]);
        assert.deepEqual(keys('@a.position'), [0, 0, 1, 1], 'two slide switches: all four combinations');
        assert.deepEqual(keys('@b.position'), [0, 1, 0, 1]);
        assert.deepEqual(keys('@d.switches'), [0, 15, 1, 2, 4, 8]);
        assert.deepEqual(keys('@h.field'), PARAM_INPUTS.hall_analog.states);
        assert.deepEqual(keys('@p.light'), [0, 0.5, 1]);
        assert.deepEqual(keys('l'), [0, 0.5, 1]);
        assert.deepEqual(parseParamKey(paramKey('slide_switch_6', 'position')), { id: 'slide_switch_6', param: 'position' });
        assert.equal(parseParamKey('button'), null);
    });
});

describe('the census drives those inputs on a solved bench', { skip: SKIP }, () => {
    test('setup', async () => {
        await loadEngine(gate.paths);
        for (const [name, data] of Object.entries(BENCH)) registerBench(name, data);
    });

    test('driving an input reproduces the bench AUTHORED in that state', () => {
        // The interaction path (setPartParam after the board is built, as
        // bw-circuit-ui's handleSetPartParam does) must land on the same
        // solve as a circuit.json that declares the value. Otherwise the census
        // would be checking documents against a state no user can reach.
        const cases = [
            ['__hall', 'hall', 'field', -0.5],
            ['__slide', 'sw', 'position', 1],
            ['__dip', 'code', 'switches', 0b10],
            ['__photo', 'pt', 'light', 0.25],
            ['__photodiode', 'pd', 'light', 0.75],
            ['__reed', 'reed', 'magnet', 1],
        ];
        for (const [bench, id, param, value] of cases) {
            const authored = structuredClone(BENCH[bench]);
            authored.parts.find(p => p.id === id).params[param] = value;
            registerBench(`${bench}_authored`, authored);
            const a = solveBench(`${bench}_authored`);
            const d = solveBench(bench, { controls: { [paramKey(id, param)]: value } });
            assert.ok(!a.error && !d.error, `${bench}: ${a.error || d.error}`);
            const volts = (s) => [...s.voltage.values()].map(v => v.toFixed(4)).sort();
            assert.deepEqual(volts(d), volts(a), `${bench}: ${param} = ${value} driven differs from authored`);
            const asIs = solveBench(bench);
            assert.notDeepEqual(volts(asIs), volts(a), `${bench}: the input changed nothing — the case proves nothing`);
        }
    });

    test('a Hall field row is solved at that field', () => {
        const md = [
            '## Observable behaviour', '',
            '| field slider | Hall output |', '|---|---|',
            '| +1 | 4.5 V |', '| −0.5 | 1.5 V |', '| 0 (authored) | 2.5 V |', '',
            '- With a field of −1 the output reads 0.5 V.',
        ].join('\n');
        const rows = verdicts('__hall', md);
        assert.deepEqual(ok(rows), ['4.5 V', '1.5 V', '2.5 V', '0.5 V']);
        assert.equal(rows[0].r.point.controls['@hall.field'], 1);
        assert.equal(rows[1].r.point.controls['@hall.field'], -0.5);
        // 3.5 V is what the bench gives at field +0.5, so an enumeration would
        // find it; the row says +1, and at +1 the bench gives 4.5.
        assert.deepEqual(bad(verdicts('__hall', md.replace('| +1 | 4.5 V |', '| +1 | 3.5 V |'))), ['3.5 V']);
    });

    test('a slide switch row is solved in that position', () => {
        const md = [
            '## Observable behaviour', '',
            '| switch position | supply current |', '|---|---|',
            '| a | 5 mA |', '| b | 2.5 mA |', '',
            '- With the slide switch in position b, R2 carries 2.5 mA.',
        ].join('\n');
        const rows = verdicts('__slide', md);
        assert.deepEqual(ok(rows), ['5 mA', '2.5 mA', '2.5 mA']);
        assert.deepEqual(bad(verdicts('__slide', md.replace('| b | 2.5 mA |', '| b | 5 mA |'))), ['5 mA']);
    });

    test('a DIP row is solved at its bit pattern instead of being declined', () => {
        const md = [
            '## Observable behaviour', '',
            '| S1 | S2 | supply current |', '|---|---|---|',
            '| on | off | 5 mA |', '| off | on | 2.5 mA |', '| on | on | 7.5 mA |', '',
            '- With S1 and S2 on, the supply delivers 7.5 mA.',
        ].join('\n');
        const rows = verdicts('__dip', md);
        assert.deepEqual(ok(rows), ['5 mA', '2.5 mA', '7.5 mA', '7.5 mA']);
        assert.equal(rows[0].r.point?.controls['@code.switches'] ?? rows[0].r.points?.[0].controls['@code.switches'], 0b01);
        assert.deepEqual(bad(verdicts('__dip', md.replace('| off | on | 2.5 mA |', '| off | on | 5 mA |'))), ['5 mA']);
    });

    test('a light level is solved on a phototransistor, a photodiode and an LDR', () => {
        const pt = [
            '## Observable behaviour', '',
            '| light | emitter voltage |', '|---|---|',
            '| full | 2.0 V |', '| half | 1.0 V |', '| 0.25 | 0.5 V |', '',
        ].join('\n');
        assert.deepEqual(ok(verdicts('__photo', pt)), ['2.0 V', '1.0 V', '0.5 V']);
        assert.deepEqual(bad(verdicts('__photo', pt.replace('| half | 1.0 V |', '| half | 2.0 V |'))), ['2.0 V']);

        const pd = '## Observable behaviour\n\n- At light 0.25 the anode sits at 0.5 V.\n';
        assert.deepEqual(ok(verdicts('__photodiode', pd)), ['0.5 V']);
        assert.deepEqual(bad(verdicts('__photodiode', pd.replace('0.5 V', '1.5 V'))), ['1.5 V']);

        // LDR at 0.5 between 100 k dark and 1 k light: 10 k over 10 k = 2.5 V.
        const ldr = [
            '## Observable behaviour', '',
            '| light | divider output |', '|---|---|',
            '| 0.5 | 2.5 V |', '| full | 4.55 V |', '',
        ].join('\n');
        assert.deepEqual(ok(verdicts('__ldr', ldr)), ['2.5 V', '4.55 V']);
        // 3.6 V is no node, drop or sum of this bench at light 0.5 (5, 2.5, 0).
        assert.deepEqual(bad(verdicts('__ldr', ldr.replace('| 0.5 | 2.5 V |', '| 0.5 | 3.6 V |'))), ['3.6 V']);
    });

    test('a reed switch row is solved with the magnet present or absent', () => {
        const md = [
            '## Observable behaviour', '',
            '| magnet | voltage across R1 |', '|---|---|',
            '| present | 5.0 V |', '',
        ].join('\n');
        assert.deepEqual(ok(verdicts('__reed', md)), ['5.0 V']);
        assert.deepEqual(bad(verdicts('__reed', md.replace('| present |', '| absent |'))), ['5.0 V']);
    });

    test('a claim that names no condition is held against the new states too', () => {
        const labels = enumerateStates('__hall').map(s => s.label);
        assert.ok(labels.includes('hall field -1') && labels.includes('hall field 1'), labels.join(' / '));
        const md = '## Observable behaviour\n\n- At its south extreme the Hall output reads 0.5 V.\n';
        assert.deepEqual(ok(verdicts('__hall', md)), ['0.5 V']);
    });
});
