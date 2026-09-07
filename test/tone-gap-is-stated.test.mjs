// A program that cannot make a sound must SAY it cannot, and the two language
// drivers must fail the same way.
//
// WHAT WAS MEASURED, AND WHERE
// ----------------------------
// Reported in brickwright-lite: the shipped `07-buzzer-siren` example was
// silent, and its author believed it had once worked. It had not broken. The
// example is correct, the referee emits nine tone events at 440 and 880 Hz on
// schedule, and the emitted program calls `_board().setTone(...)` — but the
// simulated boards this driver speaks to define no `setTone`. They offer
// `buzzerTone()`, a READER that measures a square wave the circuit already
// carries; nothing writes a tone into one. The compiled-C path agrees: this
// emitter produces `tone_set` only when the core is AVR.
//
// So the silence is a real gap in this emitter, not a defect downstream, and it
// was documented only in a consumer's help panel that a user has to open. It is
// now stated by the program itself, at generation time.
//
// A SECOND DEFECT FOUND ON THE WAY. The two drivers disagreed about the same
// silence: the JS driver guarded on `b.setTone` and skipped, while the Python
// driver called it unguarded and raised AttributeError. One program, silent in
// one language and a crash in the other, on every consumer of this emitter.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SB3Creator = (await import(path.join(ROOT, 'src/utils/sb3Creator.js'))).default;

const SIREN = [
    'DEVICE STC12C5A60S2',
    'CLOCK 11059200',
    'PIN buzzer = P1.5 TONE',
    '',
    'WHEN flag clicked:',
    '  FOREVER:',
    '    set buzzer to 440 hz',
    '    wait 0.5 seconds',
    '    set buzzer to 880 hz',
    '    wait 0.5 seconds',
    ''
].join('\n');

const BLINK = [
    'DEVICE STC12C5A60S2',
    'CLOCK 11059200',
    'PIN led = P1.0 OUTPUT ACTIVE LOW',
    '',
    'WHEN flag clicked:',
    '  FOREVER:',
    '    turn on led',
    '    wait 0.5 seconds',
    '    turn off led',
    '    wait 0.5 seconds',
    ''
].join('\n');

const compile = source => {
    const creator = new SB3Creator();
    creator.parse(source);
    const out = creator.generatePython(creator.project, {driver: 'simulator'});
    return {creator, code: Array.isArray(out) ? out.join('\n') : String(out.code || out)};
};

test('a TONE pin warns that this target is silent, naming what does make sound', () => {
    const {creator} = compile(SIREN);
    const tone = creator.warnings.filter(w => /tone/i.test(w));
    assert.equal(tone.length, 1, `expected one tone warning, got: ${tone.join(' | ')}`);
    assert.match(tone[0], /SILENT/, 'the warning must say the program makes no sound');
    assert.match(tone[0], /8051|Pico/, 'it must name the targets that cannot');
    assert.match(tone[0], /AVR|Arduino/, 'it must name the target that can');
    assert.match(tone[0], /Nothing is broken in your program/i,
        'the reporter believed their example had broken; the warning must say it has not');
});

test('a program with no TONE pin is not warned about tone (mutation)', () => {
    const {creator} = compile(BLINK);
    assert.deepEqual(creator.warnings.filter(w => /tone/i.test(w)), []);
});

test('both language drivers treat a board with no setTone the same way', () => {
    const {code} = compile(SIREN);
    assert.match(code, /hasattr\(b, "setTone"\)/,
        'the Python driver must guard, or the same program is silent in JS and a crash in Python');
    const source = readFileSync(path.join(ROOT, 'src/utils/sb3Creator.js'), 'utf8');
    assert.match(source, /if \(p && b && b\.setTone\) b\.setTone\(/,
        'the JS driver guard moved; the two drivers must stay symmetric');
});

test('the warning cannot outlive the gap: tone_set is still emitted for AVR only', () => {
    // If this fails, tone gained a driver on another core and the warning above
    // is now a lie. That is the good outcome, and it is named here rather than
    // left to rot.
    const source = readFileSync(path.join(ROOT, 'src/utils/sb3Creator.js'), 'utf8');
    assert.match(source, /this\._cUses\.tone && this\._core === 'avr'/,
        'the C emitter no longer restricts tone_set to AVR — re-measure the gap and drop the warning');
});
