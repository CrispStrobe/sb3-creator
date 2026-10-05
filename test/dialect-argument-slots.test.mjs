/**
 * A statement's argument slot takes an expression, and a line the dialect
 * cannot read is refused by name — never dropped with only a warning (task D5).
 *
 * THE DEFECT. `move forward (finds * 15) cm` — a SPIKE statement whose argument
 * is a spaced expression — built NO block: its rule matched the slot with
 * `(\S+)`, which stops at the first space inside the parentheses, so no rule
 * matched, and parse() carried on with a warning. A caller that did not read
 * warnings (the SPIKE arena's unit tests, an importer, a gate) lost the line.
 * Measured over every statement rule of parseCommand, the same shape had three
 * outcomes: `(\S+)` slots DROPPED the line (SPIKE motors/lights/sound, micro:bit
 * radio/servo/analog); lazy `(.+?)` slots followed by another slot SPLIT INSIDE
 * the parentheses and built the block with the wrong values (lcd/tft/oled
 * cursor and pixels, `set pixel … on`); and literal-only slots (`scroll text …
 * delay (\d+) ms`, the buzzer's `for (\S+) ms`) fell through to ANOTHER block.
 *
 * THE FIX, AT THE ROOT. Every statement rule matches through matchTopLevel(),
 * which masks the insides of (…) and "…" before matching: a `(\S+)` slot is one
 * TERM (a number, a name, a "text", or a whole (expression)), and no slot can
 * end inside one. The slot's text then goes through the one expression grammar
 * (parseValue), exactly as `set x to …` always did. The decompiler already
 * writes every reporter parenthesised, so export round-trips to a fixed point.
 * An expression that is NOT parenthesised in a slot followed by more words
 * (`move forward a * 15 cm`) is ambiguous in general (`start tank a * 15 50`),
 * so it is refused, with the fix in the message.
 *
 * THE REFUSAL. parse() throws UnparsedLinesError (code DIALECT_UNPARSED_LINES)
 * listing every line it could not read: an unknown statement, an over-indented
 * line, a header the dialect does not have, ELSE without IF, a line outside any
 * script, a hat it cannot build (and the body under it).
 */
import {describe, test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import SB3Creator from '../src/utils/sb3Creator.js';
import {EV3_WORDS} from '../src/utils/ev3Dialect.js';
import {ARCADE_WORDS} from '../src/utils/arcadeDialect.js';

const PROBES = [
    // [slot text, what the slot must hold]
    ['(a * 15)', {op: 'operator_multiply'}],
    ['(a + 1)', {op: 'operator_add'}],
    ['(pick random 1 to 10)', {op: 'operator_random'}],
    ['"hello world"', {text: 'hello world'}],
];

const program = (device, line, pre = '') =>
    `${device ? `DEVICE ${device}\n` : ''}${pre}\nWHEN flag clicked:\n  set a to 3\n  ${line}\n`;

/** The block built from the statement (the one after `set a to 3`), and all blocks. */
function built(src) {
    const c = new SB3Creator();
    c.parse(src);
    const all = {};
    for (const t of c.project.targets) Object.assign(all, t.blocks);
    const set = Object.values(all).find(b => b.opcode === 'data_setvariableto' && b.fields.VARIABLE[0] === 'a');
    return {c, all, stmt: set && all[set.next]};
}

/** Does the statement hold the probe's value (as an input, at any depth)? */
function holds(all, stmt, want) {
    const seen = new Set();
    const walk = (b) => {
        for (const input of Object.values(b.inputs || {})) {
            if (want.text !== undefined && Array.isArray(input[1]) && input[1][1] === want.text) return true;
            const ref = typeof input[1] === 'string' ? input[1] : null;
            if (ref && all[ref] && !seen.has(ref)) {
                seen.add(ref);
                if (want.op && all[ref].opcode === want.op) return true;
                if (walk(all[ref])) return true;
            }
        }
        return false;
    };
    return walk(stmt);
}

/**
 * One slot of one word: every probe builds the word's block holding the
 * probe, and the decompiled program reads back to a fixed point that still
 * holds it.
 */
function slotTakesExpressions(family, device, template, opcode, pre = '') {
    for (const [probe, want] of PROBES) {
        const line = template.replace('X', probe);
        const src = program(device, line, pre);
        const {c, all, stmt} = built(src);
        assert.ok(stmt, `${family}: \`${line}\` built no block`);
        assert.equal(stmt.opcode, opcode, `${family}: \`${line}\` built ${stmt.opcode}`);
        assert.ok(holds(all, stmt, want), `${family}: \`${line}\` lost ${probe}: ${JSON.stringify(stmt.inputs)}`);
        const once = c.decompile();
        const again = built(once);
        assert.equal(again.c.decompile(), once, `${family}: \`${line}\` is not a fixed point:\n${once}`);
        assert.equal(again.stmt.opcode, opcode, `${family}: \`${line}\` read back as ${again.stmt.opcode}`);
        assert.ok(holds(again.all, again.stmt, want), `${family}: \`${line}\` lost ${probe} on the way round:\n${once}`);
    }
}

describe('argument slots take an expression, and round-trip', () => {
    test('SPIKE: the words whose slot was `(\\S+)` (the D2 finding and its siblings)', () => {
        for (const [template, op] of [
            ['move forward X cm', 'spikeprime_moveForward'],
            ['move backward X rotations', 'spikeprime_moveForward'],
            ['start tank X 50', 'spikeprime_startTank'],
            ['start tank 50 X', 'spikeprime_startTank'],
            ['run motor A forward X rotations', 'spikeprime_motorRunFor'],
            ['set motor speed A X', 'spikeprime_motorSetSpeed'],
            ['set distance lights D X 0 0 9', 'spikeprime_setDistanceLights'],
            ['set distance lights D 0 0 9 X', 'spikeprime_setDistanceLights'],
            ['set pixel X 2 100', 'spikeprime_setPixel'],
            ['set pixel 1 2 X', 'spikeprime_setPixel'],
            ['play beep X 0.2', 'spikeprime_playBeep'],
            ['play spike note X 1', 'spikeprime_playNote'],
            ['set movement speed X', 'spikeprime_setMovementSpeed'],
            ['run motor A to position X', 'spikeprime_motorRunToPosition'],
        ]) slotTakesExpressions('SPIKE', 'SPIKE', template, op);
    });

    test('micro:bit: radio, servo, analog, buzzer and scroll-delay slots', () => {
        for (const [template, op] of [
            ['radio on group X power 7', 'microbitplus_radioon'],
            ['radio on group 1 power X', 'microbitplus_radioon'],
            ['radio send number X', 'microbitplus_radiosendnum'],
            ['set servo to X', 'microbitplus_servo'],
            ['set pin P1 servo X', 'microbitplus_servo'],
            ['set pin P1 analog X %', 'microbitplus_analogwrite'],
            ['set buzzer to X hz', 'microbitplus_playtone'],
            ['play tone 440 hz for X ms', 'microbitplus_playtone'],
            ['scroll text X delay 100 ms', 'microbitplus_scrolltext'],
            ['scroll text "hi" delay X ms', 'microbitplus_scrolltext'],
            ['show number X', 'microbitplus_shownumber'],
            ['plot x X y 2 on', 'microbitplus_plot'],
            ['plot x 1 y X on', 'microbitplus_plot'],
        ]) slotTakesExpressions('micro:bit', 'MICROBIT', template, op);
    });

    test('EV3: every value slot of every command word in the table', () => {
        let slots = 0;
        for (const w of EV3_WORDS.filter(w => w.kind === 'command')) {
            const names = [...w.words.matchAll(/\{([A-Z0-9_]+)\}/g)].map(m => m[1]);
            for (const name of names) {
                const template = w.words.replace(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g, (m, n, spec) => {
                    if (n === name) return 'X';
                    if (spec === 'motor') return 'B';
                    if (spec === 'sensor') return '3';
                    if (spec) return spec.split('|')[0].split('=')[0];
                    return '5';
                });
                slotTakesExpressions('EV3', 'EV3', template, `ev3comprehensive_${w.op}`);
                slots++;
            }
        }
        // counted 2026-09-29: 37 value slots across the EV3 command words.
        assert.ok(slots >= 37, `only ${slots} EV3 value slots driven (counted 37 on 2026-09-29)`);
    });

    test('Arcade: every value slot of every command word in the table (arcadeDialect.js)', () => {
        let slots = 0;
        for (const w of ARCADE_WORDS.filter(e => e.kind === 'command' && !e.alias)) {
            const names = [...w.words.matchAll(/\{([A-Z0-9_]+)(?::(cond))?\}/g)].map(m => m[1]);
            for (const name of names) {
                const template = w.words.replace(/\{([A-Z0-9_]+)(?::([^}]+))?\}/g, (m, n, spec) => {
                    if (n === name) return 'X';
                    if (spec === 'name') return 'nm';
                    if (spec === 'bool') return '1';
                    if (spec && spec.startsWith('text:')) return spec.slice(5).split('|')[0];
                    if (spec && spec !== 'cond') return spec.split('|')[0];
                    return '5';
                });
                slotTakesExpressions('Arcade', 'ARCADE', template, w.op);
                slots++;
            }
        }
        // counted 2026-10-05: 164 value slots across the Arcade command words.
        assert.ok(slots >= 164, `only ${slots} Arcade value slots driven (counted 164 on 2026-10-05)`);
    });

    test('Scratch core: motion, looks, sound, lists and control', () => {
        for (const [template, op] of [
            ['go to x: X y: 0', 'motion_gotoxy'],
            ['glide 1 secs to x: X y: 0', 'motion_glidesecstoxy'],
            ['move X steps', 'motion_movesteps'],
            ['change x by X', 'motion_changexby'],
            ['say X for 2 seconds', 'looks_sayforsecs'],
            ['set size to X', 'looks_setsizeto'],
            ['wait X seconds', 'control_wait'],
            ['add X to things', 'data_addtolist'],
            ['insert X at 1 of things', 'data_insertatlist'],
            ['replace item 1 of things with X', 'data_replaceitemoflist'],
        ]) slotTakesExpressions('Scratch', '', template, op, 'LIST things\n');
    });

    test('circuit parts: the lazy slots that split inside the parentheses', () => {
        for (const [template, op] of [
            ['lcd set cursor X 0 on 1', 'devices_lcdcursor'],
            ['lcd set cursor 1 X on 1', 'devices_lcdcursor'],
            ['lcd print X on 1', 'devices_lcdprint'],
            ['oled set cursor X 0 on 1', 'devices_oledcursor'],
            ['oled pixel X 2 1 on 1', 'devices_oledpixel'],
            ['oled hline X 2 10 on 1', 'devices_oledhline'],
            ['tft pixel X 2 R 1 G 2 B 3 on 1', 'devices_tftpixel'],
            ['tft fill X 2 3 4 R 1 G 2 B 3 on 1', 'devices_tftfill'],
            ['set pixel X 2 to 1 on 1', 'devices_setpixel'],
            ['set neopixel X to R 1 G 2 B 3 on 1', 'devices_setneopixel'],
            ['set 1 angle to X', 'devices_setservo'],
            // These four warned about whitespace and returned NOTHING, so a
            // parenthesised display expression vanished without a refusal.
            ['lcd clear X', 'devices_lcdclear'],
            ['tft clear X', 'devices_tftclear'],
            ['oled show X', 'devices_oledshow'],
            ['oled clear X', 'devices_oledclear'],
        ]) slotTakesExpressions('circuit', '', template, op);
    });

    test('sensor hats: the threshold keeps its reporter', () => {
        // The hat returned `extraBlocks: {}`, discarding the reporter its
        // threshold pointed at: the hat read back as `WHEN "light" above ():`.
        for (const [hat, op] of [['WHEN "light" above X:', 'devices_whenabove'],
            ['WHEN "sonar" closer than X:', 'devices_whencloser']]) {
            for (const [probe, want] of PROBES) {
                const src = `${hat.replace('X', probe)}\n  move 1 steps\n`;
                const c = new SB3Creator();
                c.parse(src);
                const all = {};
                for (const t of c.project.targets) Object.assign(all, t.blocks);
                const h = Object.values(all).find(b => b.opcode === op);
                assert.ok(h && holds(all, h, want), `${src}: ${JSON.stringify(h && h.inputs)}`);
                const once = c.decompile();
                const again = new SB3Creator();
                again.parse(once);
                assert.equal(again.decompile(), once, `${src} is not a fixed point:\n${once}`);
            }
        }
    });
});

describe('an unreadable line is refused by name, never dropped', () => {
    const refused = (src) => {
        try {
            new SB3Creator().parse(src);
        } catch (e) {
            if (e.code === 'DIALECT_UNPARSED_LINES') return e;
            throw e;
        }
        assert.fail(`parsed without a refusal:\n${src}`);
    };

    test('a spaced expression without parentheses, where words follow the slot', () => {
        const e = refused(program('SPIKE', 'move forward a * 15 cm'));
        assert.equal(e.name, 'UnparsedLinesError');
        assert.deepEqual(e.lines.map(l => [l.line, l.text]), [[5, 'move forward a * 15 cm']]);
        assert.match(e.message, /an argument that is an expression goes in parentheses/i);
        // The same slot as the LAST thing on a line whose rule reads to the end
        // is unambiguous, and reads (it always did).
        assert.ok(built(program('SPIKE', 'set movement speed a * 15')).stmt);
    });

    test('…and is not claimed by a generic rule as something else', () => {
        // Measured before D5: with the argument unparenthesised the word did
        // not match, and `set … to …` or `display <value>` read the line — a
        // NEW variable named "servo" / "brick volume pick random 1", or a
        // micro:bit display of the words "text a * 15 delay 100 ms".
        for (const [device, line] of [
            ['MICROBIT', 'set servo to a * 15'],
            ['MICROBIT', 'scroll text a * 15 delay 100 ms'],
            ['SPIKE', 'set pixel pick random 1 to 10 2 100'],
            ['SPIKE', 'set motor speed A pick random 1 to 10'],
            ['EV3', 'set brick volume pick random 1 to 10'],
            // Positional slots (only a space between them) split a spaced
            // expression across themselves: `lcd set cursor a * 15 0` read
            // row `a`, column `* 15 0`. They are one term each now.
            ['', 'lcd set cursor a * 15 0 on 1'],
            ['', 'tft fill 1 a * 2 3 4 R 1 G 2 B 3 on 1'],
            // A keyword-bounded slot cut `pick random 1 to 10` at its own `to`.
            ['', 'set control pick random 1 to 10 to 5'],
        ]) {
            const e = refused(program(device, line));
            assert.deepEqual(e.lines.map(l => l.text), [line], device);
            assert.match(e.lines[0].reason, /goes in parentheses/, line);
            // …and the parenthesised form reads.
            if (!/pick random/.test(line)) {
                const fixed = line.replace(/a \* (15|2)/, m => `(${m})`);
                assert.ok(built(program(device, fixed)).stmt, fixed);
            }
        }
        // A variable NAMED `item` or `letter` is not the cut-short reporter:
        // MakeCode's love-meter quiz imports as `show number item + 1`.
        assert.equal(built(program('MICROBIT', 'show number item + 1')).stmt.opcode, 'microbitplus_shownumber');
        assert.equal(built(program('', 'say letter * 2 for 1 seconds')).stmt.opcode, 'looks_sayforsecs');
        assert.equal(refused(program('', 'set control item 2 to 5')).lines[0].text, 'set control item 2 to 5');
        // The generic rules themselves still read a spaced expression.
        assert.equal(built(program('MICROBIT', 'set my var to a * 15')).stmt.opcode, 'data_setvariableto');
        assert.equal(built(program('MICROBIT', 'scroll a * 2')).stmt.opcode, 'microbit_display');
    });

    test('every way a line used to vanish is a refusal now', () => {
        for (const [src, text, reason] of [
            ['WHEN flag clicked:\n  frobnicate the widget\n', 'frobnicate the widget', /no statement of this dialect/],
            ['WHEN flag clicked:\n  move 1 steps\n      move 2 steps\n', 'move 2 steps', /unexpected indentation/],
            ['WHEN flag clicked:\n  WHILE a < 3:\n    move 1 steps\n', 'WHILE a < 3:', /not a block header/],
            ['WHEN flag clicked:\n  ELSE:\n    move 1 steps\n', 'ELSE:', /ELSE without an IF/],
            ['WHEN flag clicked:\n  IF a:\n    move 1 steps\n', 'IF a:', /malformed IF/],
            ['WHEN flag clicked:\n  REPEAT:\n    move 1 steps\n', 'REPEAT:', /malformed REPEAT/],
            ['move 1 steps\nWHEN flag clicked:\n  move 2 steps\n', 'move 1 steps', /not inside a script/],
            ['WHEN the moon rises:\n  move 1 steps\n', 'WHEN the moon rises:', /body/],
            ['WHEN flag clicked:\n  lcd clear my lcd\n', 'lcd clear my lcd', /single display name/],
        ]) {
            const e = refused(src);
            assert.ok(e.lines.some(l => l.text === text && reason.test(l.reason)),
                `${JSON.stringify(src)}: ${JSON.stringify(e.lines)}`);
        }
    });

    test('the refusal names the declaration that explains it', () => {
        // A PART this device lacks is itself refused (task D6; it was a
        // warning, and the line was skipped); its verbs then read nothing and
        // are refused too, so the refusal says why rather than only "no statement".
        const e = refused('DEVICE ARDUINO-UNO\nPART display = SEVENSEG8 SEGMENTS P0 SELECT P2.2 P2.3 P2.4\n'
            + 'WHEN flag clicked:\n  show number 42 on display\n');
        assert.deepEqual(e.lines.map(l => l.line), [2, 4]);
        assert.match(e.lines[0].reason, /SEVENSEG8 is not available/);
        assert.match(e.message, /SEVENSEG8 is not available/);
    });
});

test('every statement rule of parseCommand matches through matchTopLevel (the structural half)', () => {
    // A rule written with `line.match(...)` again would bring the defect back
    // for its word: `(\S+)` stops inside the parentheses. Enumerated from the
    // source, so a new rule is covered the day it is written.
    const src = fs.readFileSync(new URL('../src/utils/sb3Creator.js', import.meta.url), 'utf8');
    const start = src.indexOf('    parseCommand(line, target) {');
    const end = src.indexOf('throw new ParseError(`Unknown command: "${line}"`);', start);
    assert.ok(start > 0 && end > start, 'parseCommand not found');
    const body = src.slice(start, end);
    const raw = body.split('\n').map((l, i) => [i, l]).filter(([, l]) => /\bline\.match\(/.test(l));
    assert.deepEqual(raw.map(([, l]) => l.trim()), [],
        'a statement rule matches the raw line; use matchTopLevel(line, re)');
    const rules = (body.match(/matchTopLevel\(line, /g) || []).length;
    // counted 2026-09-29: 211 statement rules in parseCommand.
    assert.ok(rules >= 211, `only ${rules} rules found (counted 211 on 2026-09-29) — has parseCommand moved?`);
});
