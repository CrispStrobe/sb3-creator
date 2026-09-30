/**
 * The dialect's text escapes, and the round trip they make a fixed point
 * (task D6, found by D5).
 *
 * THE DEFECT. The value parser read `"a \"b\""` as the whole line's text
 * INCLUDING its outer quotes and backslashes (`matchQuote` stopped at the
 * escaped quote, so the literal rule failed and the fallback kept the raw
 * characters), and the decompiler wrote a text as `"${text}"` with no escaping
 * at all — a Scratch `say` of `a "b"` exported as `say "a "b""`, which read back
 * as something else. A text holding a line break exported as two lines.
 *
 * THE RULES (sb3Creator.js, escapeTextLiteral / unescapeTextLiteral). Inside
 * "…": `\"` a quote, `\\` a backslash, `\n` a line break, `\r` a carriage
 * return, `\t` a tab — JSON's escapes for those characters; any other `\x` is
 * the two characters it spells. The value parser, every statement rule that
 * reads a quoted text directly, the scanners that skip over texts (operator
 * splitting, parentheses, `//` comments, custom-block arguments) and the
 * declaration initialisers all read the escapes; the decompiler writes them.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const TEXTS = ['a "b" c', 'back\\slash', 'end\\', '"', '\\"', 'C:\\temp', 'two\nlines', 'cr\rhere',
    'tab\there', '\\n is not a line break', 'join', ' // not a comment', '(paren', ''];

const allBlocks = (c) => Object.assign({}, ...c.project.targets.map((t) => t.blocks));
const parse = (src) => { const c = new SB3Creator(); c.parse(src); return c; };

/** Put `text` into the text input of the block `opcode`, decompile, re-parse: the same text, a fixed point. */
function roundTrips(src, opcode, input, text) {
    const c = parse(src);
    const b = Object.values(allBlocks(c)).find((x) => x.opcode === opcode);
    assert.ok(b, `${opcode} not built from ${src}`);
    b.inputs[input] = [1, [10, text]];
    const once = c.decompile();
    const again = parse(once);
    const b2 = Object.values(allBlocks(again)).find((x) => x.opcode === opcode);
    assert.ok(b2, `${JSON.stringify(text)}: ${opcode} did not read back from\n${once}`);
    assert.equal(b2.inputs[input][1][1], text, `${JSON.stringify(text)} changed on the way round:\n${once}`);
    assert.equal(again.decompile(), once, `${JSON.stringify(text)}: not a fixed point`);
}

test('the value parser reads the escapes', () => {
    const c = parse('WHEN flag clicked:\n  say "a \\"b\\" c\\\\d\\ne\\tf"\n');
    const say = Object.values(allBlocks(c)).find((b) => b.opcode === 'looks_say');
    assert.equal(say.inputs.MESSAGE[1][1], 'a "b" c\\d\ne\tf');
    // An unknown escape is the two characters it spells (legacy text reads as written).
    const legacy = parse('WHEN flag clicked:\n  say "C:\\qdir"\n');
    assert.equal(Object.values(allBlocks(legacy)).find((b) => b.opcode === 'looks_say').inputs.MESSAGE[1][1], 'C:\\qdir');
});

test('an escaped quote does not end the text for the scanners around it', () => {
    // operator splitting: the ` join ` inside the text is text
    const c = parse('WHEN flag clicked:\n  say ("x \\" join y" join z)\n');
    const all = allBlocks(c);
    const join = Object.values(all).find((b) => b.opcode === 'operator_join');
    assert.equal(join.inputs.STRING1[1][1], 'x " join y');
    // a `//` inside a text with an escaped quote before it is not a comment
    const d = parse('WHEN flag clicked:\n  say "a \\" // b"\n');
    assert.equal(Object.values(allBlocks(d)).find((b) => b.opcode === 'looks_say').inputs.MESSAGE[1][1], 'a " // b');
    // a custom-block argument
    const e = parse('DEFINE greet (who):\n  say who\nWHEN flag clicked:\n  greet "the \\"boss\\""\n');
    const call = Object.values(allBlocks(e)).find((b) => b.opcode === 'procedures_call');
    const arg = Object.values(call.inputs)[0];
    assert.equal(arg[1][1], 'the "boss"');
});

test('Scratch text blocks with quotes, backslashes and line breaks round-trip to a fixed point', () => {
    const cases = [
        ['WHEN flag clicked:\n  say "x"\n', 'looks_say', 'MESSAGE'],
        ['WHEN flag clicked:\n  think "x" for 2 seconds\n', 'looks_thinkforsecs', 'MESSAGE'],
        ['WHEN flag clicked:\n  ask "x" and wait\n', 'sensing_askandwait', 'QUESTION'],
        ['LIST things\nWHEN flag clicked:\n  add "x" to things\n', 'data_addtolist', 'ITEM'],
        ['WHEN flag clicked:\n  set v to "x"\n', 'data_setvariableto', 'VALUE'],
        ['WHEN flag clicked:\n  say (join "x" "y")\n', 'operator_join', 'STRING1'],
        ['WHEN flag clicked:\n  IF answer = "x" THEN:\n    say "y"\n', 'operator_equals', 'OPERAND2'],
        ['DEVICE SPIKE\nWHEN flag clicked:\n  display text "x"\n', 'spikeprime_displayText', 'TEXT'],
        ['DEVICE MICROBIT\nWHEN flag clicked:\n  radio send text "x"\n', 'microbitplus_radiosendstr', 'TEXT'],
        ['DEVICE MICROBIT\nWHEN flag clicked:\n  show text "x"\n', 'microbitplus_showtext', 'TEXT'],
        ['WHEN flag clicked:\n  lcd print "x" on 1\n', 'devices_lcdprint', 'TEXT'],
        ['WHEN flag clicked:\n  oled print "x" on 1\n', 'devices_oledprint', 'TEXT'],
        ['WHEN flag clicked:\n  tft print "x" on 1\n', 'devices_tftprint', 'TEXT'],
    ];
    for (const [src, opcode, input] of cases) {
        for (const text of TEXTS) roundTrips(src, opcode, input, text);
    }
});

test('the print/display text modes, raw lines, broadcasts and initial values round-trip too', () => {
    for (const text of TEXTS) {
        // stc12_print in text mode is written `print "…"`.
        const p = parse('WHEN flag clicked:\n  print "x"\n');
        const pb = Object.values(allBlocks(p)).find((b) => b.opcode === 'stc12_print');
        pb.inputs.VALUE = [1, [10, text]];
        const once = p.decompile();
        const back = Object.values(allBlocks(parse(once))).find((b) => b.opcode === 'stc12_print');
        assert.equal(back.inputs.VALUE[1][1], text, once);
        // A raw (untranslated) line is a field.
        const r = parse('WHEN flag clicked:\n  raw "x"\n');
        Object.values(allBlocks(r)).find((b) => b.opcode === 'bw_raw').fields.TEXT = [text, null];
        const rOnce = r.decompile();
        assert.equal(Object.values(allBlocks(parse(rOnce))).find((b) => b.opcode === 'bw_raw').fields.TEXT[0], text, rOnce);
        // A variable's initial value.
        const g = parse('GLOBAL greeting = "x"\nWHEN flag clicked:\n  say greeting\n');
        const stage = g.project.targets.find((t) => t.isStage);
        Object.values(stage.variables)[0][1] = text || 'x';
        const gOnce = g.decompile();
        const g2 = parse(gOnce);
        assert.equal(Object.values(g2.project.targets.find((t) => t.isStage).variables)[0][1], text || 'x', gOnce);
        assert.equal(g2.decompile(), gOnce);
    }
    // A broadcast name with a quote in it.
    const b = parse('WHEN I receive "say \\"go\\"":\n  say "x"\nWHEN flag clicked:\n  broadcast "say \\"go\\""\n');
    assert.deepEqual(Object.values(b.project.targets.find((t) => t.isStage).broadcasts), ['say "go"']);
    const bOnce = b.decompile();
    assert.equal(parse(bOnce).decompile(), bOnce);
    assert.match(bOnce, /WHEN I receive "say \\"go\\"":/);
});

test('a text JSON.stringify writes is the dialect\'s text (the readers write it that way)', () => {
    for (const text of TEXTS) {
        assert.equal(SB3Creator.escapeTextLiteral(text), JSON.stringify(text), JSON.stringify(text));
        assert.equal(SB3Creator.unescapeTextLiteral(SB3Creator.escapeTextLiteral(text).slice(1, -1)), text);
    }
});

test('Python, JavaScript, host C and micro:bit MicroPython carry the text there and back', async () => {
    const {default: pythonToPseudocode} = await import('../src/utils/pythonToPseudocode.js');
    const {default: javascriptToPseudocode} = await import('../src/utils/javascriptToPseudocode.js');
    const {default: cHostToPseudocode} = await import('../src/utils/cHostToPseudocode.js');
    const {default: micropythonToPseudocode} = await import('../src/utils/micropythonToPseudocode.js');
    const texts = ['a "b" c', 'back\\slash', 'two\nlines', 'tab\there'];
    for (const text of texts) {
        const c = parse('WHEN flag clicked:\n  say "x"\n');
        Object.values(allBlocks(c)).find((b) => b.opcode === 'looks_say').inputs.MESSAGE = [1, [10, text]];
        for (const [name, gen, read] of [
            ['python', () => c.generatePython(), pythonToPseudocode],
            ['javascript', () => c.generateJavaScript(), javascriptToPseudocode],
            ['host C', () => c.generateHostC(), cHostToPseudocode],
        ]) {
            const code = gen();
            const out = read(typeof code === 'string' ? code : code.code || code.py || code.js);
            const pseudo = typeof out === 'string' ? out : out.pseudocode;
            const back = Object.values(allBlocks(parse(pseudo))).find((b) => b.opcode === 'looks_say');
            assert.equal(back && back.inputs.MESSAGE[1][1], text, `${name}: ${JSON.stringify(text)}\n${pseudo}`);
        }
        // micro:bit MicroPython: `show text` and `radio send text`.
        const m = parse('DEVICE MICROBIT\nWHEN flag clicked:\n  show text "x"\n  radio send text "x"\n');
        for (const b of Object.values(allBlocks(m))) {
            if (b.opcode === 'microbitplus_showtext' || b.opcode === 'microbitplus_radiosendstr') b.inputs.TEXT = [1, [10, text]];
        }
        const mp = m.generateMicroPython();
        const r = micropythonToPseudocode(typeof mp === 'string' ? mp : mp.py);
        const got = Object.values(allBlocks(parse(r.pseudocode)))
            .filter((b) => b.opcode === 'microbitplus_showtext' || b.opcode === 'microbitplus_radiosendstr')
            .map((b) => b.inputs.TEXT[1][1]);
        assert.deepEqual(got, [text, text], `micropython: ${JSON.stringify(text)}\n${r.pseudocode}`);
    }
});
