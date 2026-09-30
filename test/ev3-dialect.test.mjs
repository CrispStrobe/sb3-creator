/**
 * The DEVICE EV3 dialect: every word of ev3Dialect.js parses to its one
 * `ev3comprehensive` block and decompiles back to the same text, and every
 * opcode of the pinned extension surface is either a word or classified.
 *
 * The words are the target of Lite's MakeCode EV3 importer (pxt-ev3 programs
 * -> this dialect -> ev3comprehensive blocks), so a word that stopped reading
 * back would lose a MakeCode call on the way round.
 */
import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import {RUNTIME_EXTENSIONS} from '../src/utils/runtimeRegistry.generated.js';
import {
    EV3_WORDS, EV3_DIALECT_OPS, EV3_DIALECT_EXCLUSIONS, EV3_DIALECT_EXCLUSION_REASONS,
    matchEv3Word, ev3Tokens
} from '../src/utils/ev3Dialect.js';

const canonical = RUNTIME_EXTENSIONS.ev3comprehensive.ops;

/** One sample line per word, with a value in every slot. */
function sample(entry) {
    return entry.words.replace(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g, (m, name, spec) => {
        if (spec === 'motor') return 'B';
        if (spec === 'sensor') return '3';
        if (spec) return spec.split('|')[spec.split('|').length > 1 ? 1 : 0].split('=')[0];
        return name === 'TEXT' ? '"hi there"' : '(n + 1)';
    });
}

const program = lines => `DEVICE EV3\n\nWHEN flag clicked:\n${lines.map(l => `  ${l}`).join('\n')}\n`;

function compile(bw) {
    const c = new SB3Creator();
    const project = c.parse(bw);
    return {c, project, blocks: Object.values(project.targets[0].blocks)};
}

/** The statement lines of a decompiled single-script program. */
function body(text) {
    const lines = text.split('\n');
    const at = lines.findIndex(l => /WHEN flag clicked:/.test(l));
    return lines.slice(at + 1).map(l => l.trim()).filter(Boolean);
}

describe('EV3 dialect census', () => {
    test('all 82 pinned ev3comprehensive opcodes are mapped or classified exactly once', () => {
        assert.equal(Object.keys(canonical).length, 82,
            'counted 74 opcodes in the pinned ev3comprehensive getInfo surface (runtimeRegistry.generated.js); '
            + '82 at the extensions pin of 2026-09-29, which brought upstream EV3 #5/#7');
        const accounted = [...EV3_DIALECT_OPS, ...Object.values(EV3_DIALECT_EXCLUSIONS).flat()];
        assert.equal(new Set(accounted).size, accounted.length, 'an opcode is listed twice');
        assert.deepEqual([...accounted].sort(), Object.keys(canonical).sort());
        assert.equal(EV3_DIALECT_OPS.length, 48, 'counted 48 bidirectional words on 2026-09-29');
        for (const kind of Object.keys(EV3_DIALECT_EXCLUSIONS)) {
            assert.ok(EV3_DIALECT_EXCLUSION_REASONS[kind], `${kind} has no stated reason`);
        }
    });

    test('each word agrees with the extension on its kind and its arguments', () => {
        const KIND = {command: 'command', reporter: 'reporter', boolean: 'boolean'};
        for (const w of EV3_WORDS) {
            const op = canonical[w.op];
            assert.equal(op.kind, KIND[w.kind], `${w.op}: the word is a ${w.kind}, the block a ${op.kind}`);
            const slots = [...w.words.matchAll(/\{([A-Z0-9_]+)/g)].map(m => m[1]).sort();
            assert.deepEqual(slots, [...op.args].sort(), `${w.op}: slots vs the block's arguments`);
        }
    });

    test('no two words share a spelling', () => {
        const seen = new Map();
        for (const w of EV3_WORDS) {
            const s = sample(w);
            assert.ok(!seen.has(s), `${w.op} and ${seen.get(s)} both read "${s}"`);
            seen.set(s, w.op);
        }
    });
});

describe('EV3 dialect: every word round-trips', () => {
    for (const w of EV3_WORDS) {
        test(`${w.op}: "${sample(w)}"`, () => {
            const text = sample(w);
            const line = w.kind === 'command' ? text : w.kind === 'boolean' ? `IF ${text} THEN:\n    brick beep` : `set q to ${text}`;
            const {c, project, blocks} = compile(program(line.split('\n')));
            assert.deepEqual(c.warnings, []);
            assert.deepEqual(project.extensions, ['ev3comprehensive']);
            const mine = blocks.filter(b => b.opcode === `ev3comprehensive_${w.op}`);
            assert.equal(mine.length, 1, `expected one ev3comprehensive_${w.op} block`);
            // Menus are shadow blocks under THIS block, as Scratch serializes them.
            for (const [name, input] of Object.entries(mine[0].inputs)) {
                const shadow = project.targets[0].blocks[input[1]];
                if (shadow && /_menu_/.test(shadow.opcode)) {
                    assert.equal(shadow.shadow, true, `${name}: a menu is a shadow`);
                    assert.equal(project.targets[0].blocks[shadow.parent].opcode, `ev3comprehensive_${w.op}`,
                        `${name}: the menu shadow's parent`);
                }
            }
            const back = new SB3Creator().decompile(project);
            const expected = w.kind === 'command' ? text : w.kind === 'boolean' ? `IF ${text} THEN:` : `set q to (${text})`;
            assert.ok(body(back).includes(expected), `decompiled:\n${back}`);
        });
    }

    test('a whole program is a fixed point, and quotes in text survive', () => {
        const bw = program([
            'run motor BC at (0 - speed) % for 2 rotations',
            'show brick text "say \\"hi\\"" at 4 14',
            'show brick text ("d=" join (ev3 distance 4 cm)) at 4 4',
            'IF (ev3 touch 1 bumped) and (ev3 ultrasonic 4 detects) THEN:',
            '  stop motor A coast',
            'REPEAT UNTIL (ev3 distance 4 cm) < 10:',
            '  steer -20 at 40 % for 3 rotations'
        ]);
        const c1 = new SB3Creator();
        const dc1 = c1.decompile(c1.parse(bw));
        const c2 = new SB3Creator();
        assert.equal(c2.decompile(c2.parse(dc1)), dc1);
        const {blocks} = compile(bw);
        const text = blocks.find(b => b.opcode === 'ev3comprehensive_screenText' && b.inputs.TEXT[1][0] === 10);
        assert.equal(text.inputs.TEXT[1][1], 'say "hi"');
    });
});

describe('EV3 dialect: boundaries', () => {
    test('the command words exist on DEVICE EV3 only', () => {
        const c = new SB3Creator();
        c.parse('DEVICE SPIKE\n\nWHEN flag clicked:\n  stop motor A\n');
        const {blocks} = compile(program(['stop motor A brake']));
        assert.ok(blocks.some(b => b.opcode === 'ev3comprehensive_motorStop'));
        const spike = Object.values(c.project.targets[0].blocks).map(b => b.opcode);
        assert.ok(spike.includes('spikeprime_motorStop') && !spike.some(o => o.startsWith('ev3')),
            'DEVICE SPIKE keeps its own `stop motor A`');
        // An EV3 spelling on another device is not an EV3 block there — and not
        // a silently dropped line either: it is refused, naming both lines.
        const other = new SB3Creator();
        assert.throws(() => other.parse('DEVICE SPIKE\n\nWHEN flag clicked:\n  run motor A at 50 %\n  clear brick screen\n'),
            e => e.code === 'DIALECT_UNPARSED_LINES'
                && e.lines.map(l => l.text).join('|') === 'run motor A at 50 %|clear brick screen');
        const ops = Object.values(other.project.targets[0].blocks).map(b => b.opcode);
        assert.ok(!ops.some(o => o.startsWith('ev3comprehensive')), `DEVICE SPIKE made ${ops.join(', ')}`);
    });

    test('the stage words keep their meaning on DEVICE EV3', () => {
        const {blocks} = compile(program(['set volume to 50', 'stop all sounds', 'set brick volume 50']));
        const ops = blocks.map(b => b.opcode);
        assert.ok(ops.includes('sound_setvolumeto') && ops.includes('sound_stopallsounds'));
        assert.ok(ops.includes('ev3comprehensive_setVolume'));
    });

    test('a port the brick does not have is not a word', () => {
        assert.equal(matchEv3Word('run motor E at 50 %', ['command']), null);
        assert.equal(matchEv3Word('ev3 touch 5 pressed', ['boolean']), null);
        assert.ok(matchEv3Word('run motor bc at 50 %', ['command']).slots.PORT.value === 'BC');
    });

    test('tokens: quoted text and nested groups are one token each', () => {
        assert.deepEqual(ev3Tokens('show brick text "a (b" at (x + (y * 2)) 3'),
            ['show', 'brick', 'text', '"a (b"', 'at', '(x + (y * 2))', '3']);
        assert.equal(ev3Tokens('run motor A at (1 %'), null);
    });
});
