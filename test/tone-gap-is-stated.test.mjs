// A TONE pin sounds in the simulator and is silent on compiled 8051 hardware,
// and the program must say which answer applies to it.
//
// WHAT WAS MEASURED, AND WHERE
// ----------------------------
// Reported in brickwright-lite: the shipped `07-buzzer-siren` example was
// silent, and its author believed it had once worked. It had not broken. The
// example is correct, the referee emits nine tone events at 440 and 880 Hz on
// schedule, and the emitted program calls `_board().setTone(...)` — and no
// board defined setTone. Boards offered `buzzerTone()`, a READER that measures a
// square wave the circuit already carries; nothing wrote a tone into one.
//
// That half is now closed upstream: bw-board implements setTone and matches the
// pin by name, so the simulator sounds on every family that can declare a TONE
// pin. The COMPILED half is not closed and is not claimed to be — this emitter
// still produces `tone_set` only when the core is AVR, so real 8051 or Pico
// firmware stays silent. The warning therefore has to separate the two, or it
// tells half the users the wrong thing whichever way it is worded.
//
// A SECOND DEFECT FOUND ON THE WAY. The two drivers disagreed about the same
// silence: the JS driver guarded on `b.setTone` and skipped, while the Python
// driver called it unguarded and raised AttributeError. One program, silent in
// one language and a crash in the other, on every consumer of this emitter.
// Both now say the same sentence, once, when the attached board is too old.
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

test('a TONE pin warns, and separates the simulator from the compiled firmware', () => {
    const {creator} = compile(SIREN);
    const tone = creator.warnings.filter(w => /tone/i.test(w));
    assert.equal(tone.length, 1, `expected one tone warning, got: ${tone.join(' | ')}`);
    assert.match(tone[0], /simulator/i, 'the warning must say the simulator sounds');
    assert.match(tone[0], /SILENT/, 'and that something here makes no sound');
    assert.match(tone[0], /compiled/i,
        'an undifferentiated warning is wrong either way now: the two paths disagree');
    assert.match(tone[0], /8051|Pico/, 'it must name the hardware that stays silent');
    assert.match(tone[0], /AVR|Arduino/, 'it must name the build that does not');
    assert.match(tone[0], /Nothing is broken in your program/i,
        'the reporter believed their example had broken; the warning must say it has not');
});

test('a program with no TONE pin is not warned about tone (mutation)', () => {
    const {creator} = compile(BLINK);
    assert.deepEqual(creator.warnings.filter(w => /tone/i.test(w)), []);
});

test('both language drivers SAY a board has no setTone, rather than skipping', () => {
    // A guard that returns quietly reproduces the original defect one layer in:
    // a correct program, a silent buzzer, and nothing that names the reason.
    const {code} = compile(SIREN);
    assert.match(code, /hasattr\(b, "setTone"\)/,
        'the Python driver must guard, or the same program is silent in JS and a crash in Python');
    assert.match(code, /this board has no setTone/,
        'the Python driver must name the missing method, not skip in silence');
    const source = readFileSync(path.join(ROOT, 'src/utils/sb3Creator.js'), 'utf8');
    assert.match(source, /if \(!b\.setTone\)/,
        'the JS driver guard moved; the two drivers must stay symmetric');
    // The same sentence in both languages, so a user comparing two runs of the
    // same program is not told two different things.
    const notice = /this board has no setTone\(\), so the buzzer stays/g;
    assert.equal((source.match(notice) || []).length, 2,
        'the JS and Python notices must be one sentence, not two that drift apart');
});

test('the notice fires once, not once per note (mutation)', () => {
    const {code} = compile(SIREN);
    assert.match(code, /_bw_tone_unsupported/,
        'a siren changes note twice a second; an unlatched notice would flood the console');
});

test('the warning cannot outlive the gap: tone_set is still emitted for AVR only', () => {
    // If this fails, tone gained a driver on another core and the warning above
    // is now a lie. That is the good outcome, and it is named here rather than
    // left to rot.
    const source = readFileSync(path.join(ROOT, 'src/utils/sb3Creator.js'), 'utf8');
    assert.match(source, /this\._cUses\.tone && this\._core === 'avr'/,
        'the C emitter no longer restricts tone_set to AVR — re-measure the gap and drop the warning');
});
