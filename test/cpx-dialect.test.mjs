/**
 * The DEVICE CPX dialect (task A9): every word of cpxDialect.js parses to its
 * one `circuitplayground` block and decompiles back to the same text, and the
 * table covers the pinned extension surface exactly.
 *
 * The words are the target of Lite's MakeCode Circuit Playground translator
 * (pxt-adafruit programs -> this dialect -> circuitplayground blocks), so a word
 * that stopped reading back would lose a MakeCode call on the way round.
 */
import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import {RUNTIME_EXTENSIONS} from '../src/utils/runtimeRegistry.generated.js';
import {CPX_WORDS, CPX_DIALECT_OPS, cpxWordFor} from '../src/utils/cpxDialect.js';

const canonical = RUNTIME_EXTENSIONS.circuitplayground.ops;

/** One sample line per word, with a value in every slot (a menu takes a choice). */
function sample(entry) {
    return entry.words.replace(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g, (m, name, spec) => {
        if (spec && spec.startsWith('menu:')) return spec.split(':')[2].split('|')[1];
        if (spec) return spec.split('|')[1] ?? spec.split('|')[0];
        return name === 'COLORS' ? '"red green blue"' : '(n + 1)';
    });
}

const program = (lines, device = 'CPX') =>
    `DEVICE ${device}\n\nWHEN flag clicked:\n${lines.map(l => `  ${l}`).join('\n')}\n`;

function compile(bw) {
    const c = new SB3Creator();
    const project = c.parse(bw);
    return {c, project, blocks: Object.values(project.targets[0].blocks)};
}

const lines = text => text.split('\n').map(l => l.trim()).filter(Boolean);

describe('CPX dialect census', () => {
    test('the table is the pinned circuitplayground surface, all 45 opcodes', () => {
        assert.equal(Object.keys(canonical).length, 45,
            'counted 45 opcodes in the pinned circuitplayground getInfo surface (runtimeRegistry.generated.js)');
        assert.equal(new Set(CPX_DIALECT_OPS).size, CPX_DIALECT_OPS.length, 'an opcode is listed twice');
        assert.deepEqual([...CPX_DIALECT_OPS].sort(), Object.keys(canonical).sort());
    });

    test('each word agrees with the extension on its kind and its arguments', () => {
        for (const w of CPX_WORDS) {
            const op = canonical[w.op.replace(/^circuitplayground_/, '')];
            assert.equal(op.kind, w.kind, `${w.op}: the word is a ${w.kind}, the block a ${op.kind}`);
            const slots = [...w.words.matchAll(/\{([A-Z0-9_]+)/g)].map(m => m[1]).sort();
            assert.deepEqual(slots, [...op.args].sort(), `${w.op}: slots vs the block's arguments`);
        }
    });

    test('reporters and booleans begin with `cpx`, hats with `when`', () => {
        for (const w of CPX_WORDS) {
            if (w.kind === 'reporter' || w.kind === 'boolean') assert.match(w.words, /^cpx /, w.op);
            if (w.kind === 'hat') assert.match(w.words, /^when /, w.op);
        }
    });

    test('no two words share a spelling', () => {
        const seen = new Map();
        for (const w of CPX_WORDS) {
            const s = sample(w);
            assert.ok(!seen.has(s), `${w.op} and ${seen.get(s)} both read "${s}"`);
            seen.set(s, w.op);
        }
    });
});

describe('CPX dialect: every word round-trips', () => {
    for (const w of CPX_WORDS) {
        test(`${w.op}: "${sample(w)}"`, () => {
            const text = sample(w);
            let bw;
            if (w.kind === 'hat') bw = `DEVICE CPX\n\nWHEN ${text.replace(/^when /, '')}:\n  clear pixels\n`;
            else if (w.kind === 'command') bw = program([text]);
            else if (w.kind === 'boolean') bw = program([`IF ${text} THEN:`, '  clear pixels']);
            else bw = program([`set q to ${text}`]);
            const {c, project, blocks} = compile(bw);
            assert.deepEqual(c.warnings, []);
            assert.ok(project.extensions.includes('circuitplayground'), `extensions: ${project.extensions}`);
            const mine = blocks.filter(b => b.opcode === w.op);
            assert.equal(mine.length, 1, `expected one ${w.op} block, got ${blocks.map(b => b.opcode)}`);
            for (const [name, input] of Object.entries(mine[0].inputs)) {
                const shadow = project.targets[0].blocks[input[1]];
                if (shadow && /_menu_/.test(shadow.opcode)) {
                    assert.equal(shadow.opcode, `circuitplayground_menu_${shadow.opcode.split('_menu_')[1]}`);
                    assert.equal(shadow.shadow, true, `${name}: a menu is a shadow`);
                    assert.equal(project.targets[0].blocks[shadow.parent].opcode, w.op, `${name}: the menu shadow's parent`);
                }
            }
            const back = lines(new SB3Creator().decompile(project));
            const expected = w.kind === 'hat' ? `WHEN ${text.replace(/^when /, '')}:`
                : w.kind === 'command' ? text : w.kind === 'boolean' ? `IF ${text} THEN:` : `set q to (${text})`;
            assert.ok(back.includes(expected), `expected "${expected}" in:\n${back.join('\n')}`);
        });
    }

    test('a whole program is a fixed point', () => {
        const bw = 'DEVICE CPX\n\n'
            + 'WHEN flag clicked:\n'
            + '  set pixel brightness to 40\n'
            + '  set all pixels to red\n'
            + '  show animation rainbow for 500 ms\n'
            + '  set pixel 3 to (cpx red 0 green 255 blue 0)\n'
            + '  IF cpx button A+B is pressed THEN:\n'
            + '    play board sound powerUp until done\n'
            + '  play tone (cpx note C5) Hz for (cpx quarter beat) ms\n'
            + '  graph (cpx light level) up to 255\n'
            + '  set q to ((cpx acceleration x) + 1)\n'
            + 'WHEN button A longClick:\n'
            + '  show ring "red green blue red green blue red green blue red"\n'
            + 'WHEN temperature hot at 30 C:\n'
            + '  set all pixels to (cpx color orange)\n'
            + 'WHEN gesture tiltLeft:\n'
            + '  set gradient from red to blue\n'
            + 'WHEN loud sound:\n'
            + '  stop all board sounds\n';
        const c1 = new SB3Creator();
        const dc1 = c1.decompile(c1.parse(bw));
        assert.deepEqual(c1.warnings, []);
        const c2 = new SB3Creator();
        assert.equal(c2.decompile(c2.parse(dc1)), dc1);
        assert.ok(cpxWordFor('circuitplayground_setall'));
    });
});

describe('CPX dialect: boundaries', () => {
    test('the command words exist on DEVICE CPX only', () => {
        const {blocks} = compile(program(['set all pixels to red']));
        assert.ok(blocks.some(b => b.opcode === 'circuitplayground_setall'));
        const other = new SB3Creator();
        assert.throws(() => other.parse(program(['set all pixels to red', 'clear pixels'], 'PICO')),
            e => e.code === 'DIALECT_UNPARSED_LINES');
    });

    test('the stage sound words keep their meaning on DEVICE CPX', () => {
        const {blocks} = compile(program(['set volume to 50', 'stop all sounds', 'set board volume to 50']));
        const ops = blocks.map(b => b.opcode);
        assert.ok(ops.includes('sound_setvolumeto') && ops.includes('sound_stopallsounds'), ops.join(', '));
        assert.ok(ops.includes('circuitplayground_setvolume'));
    });

    test('a colour may be a value expression, not only a menu choice', () => {
        const {blocks} = compile(program(['set all pixels to (cpx hue 85 sat 255 val 255)']));
        const set = blocks.find(b => b.opcode === 'circuitplayground_setall');
        const value = blocks.find(b => b.opcode === 'circuitplayground_hsv');
        assert.ok(set && value, 'setall takes the hsv reporter');
    });

    test('the aliases name the same board', () => {
        for (const name of ['CIRCUITPLAYGROUND', 'ADAFRUIT', 'circuit_playground_express']) {
            const {blocks} = compile(program(['clear pixels'], name));
            assert.ok(blocks.some(b => b.opcode === 'circuitplayground_clearpixels'), name);
        }
    });

    test('a pad the board does not have is not a pin', () => {
        const c = new SB3Creator();
        assert.throws(() => c.parse('DEVICE CPX\nPIN led = A9 OUTPUT\n\nWHEN flag clicked:\n  clear pixels\n'));
    });
});
