import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const ID = '56-logical-on-pin-level';
const source = readFileSync(join(EXAMPLES, ID, 'program.bw'), 'utf8');
const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const lesson = index.find(entry => entry.id === ID);

const endpoint = (wire, side) => ({
    part: typeof wire[side] === 'object' ? wire[side].part : wire[side],
    terminal: typeof wire[side] === 'object'
        ? wire[side].terminal : wire[`${side}Terminal`],
});

function connected(data, aPart, aTerminal, bPart, bTerminal) {
    return (data.wires || []).some(wire => {
        const from = endpoint(wire, 'from');
        const to = endpoint(wire, 'to');
        return (from.part === aPart && from.terminal === aTerminal
                && to.part === bPart && to.terminal === bTerminal)
            || (to.part === aPart && to.terminal === aTerminal
                && from.part === bPart && from.terminal === bTerminal);
    });
}

function benchMatchesPolarity(data, activeLow) {
    if (activeLow) {
        return connected(data, 'VCC', 'vcc', 'R_led', 'a')
            && connected(data, 'LED_led', 'cathode', 'MCU', data.parts
                .find(part => part.id === 'MCU').terminals[0]);
    }
    return connected(data, 'MCU', data.parts.find(part => part.id === 'MCU').terminals[0],
        'R_led', 'a')
        && connected(data, 'LED_led', 'cathode', 'GND', 'gnd');
}

const body = text => text.slice(text.indexOf('WHEN'))
    .replace(/#[^\n]*/g, '').replace(/\s+/g, ' ').trim();

describe('56-logical-on-pin-level keeps intent while changing electrical polarity', () => {
    test('every offered target preserves the program body and pairs its declaration with its bench', () => {
        assert.ok(lesson, 'portable polarity lesson is indexed');
        assert.equal(lesson.devices.length, 11, 'all eleven benchable MCU targets are offered');
        const sourceBody = body(source);

        for (const device of lesson.devices) {
            const pool = SB3Creator.RETARGET_POOLS[device];
            assert.ok(pool, `${device} has retarget metadata`);
            const retargeted = SB3Creator.retargetPseudocode(source, device);
            assert.equal(retargeted.ok, true, `${device}: ${retargeted.reason || ''}`);
            assert.equal(body(retargeted.pseudocode), sourceBody,
                `${device} changes declarations, not logical behavior`);

            const pinLine = retargeted.pseudocode.match(/^PIN\s+led\s*=.*$/m)?.[0] || '';
            assert.equal(/\bACTIVE LOW\b/.test(pinLine), pool.ledActiveLow === true,
                `${device} declaration follows its LED polarity convention`);

            const bench = JSON.parse(readFileSync(
                join(EXAMPLES, ID, `circuit.${device}.json`), 'utf8'));
            assert.equal(benchMatchesPolarity(bench, pool.ledActiveLow === true), true,
                `${device} bench wiring follows its declaration`);

            // Mutation proof: interpreting the same bench as the opposite
            // convention must fail, so this is not merely checking file presence.
            assert.equal(benchMatchesPolarity(bench, pool.ledActiveLow !== true), false,
                `${device} bench must not satisfy both polarities`);
        }
    });
});
