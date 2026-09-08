// P3 part 3 reachability: the DENOMINATOR of the Pico MicroPython servo/motor
// path this repo now emits.
//
// A gallery-route differential (walk the corpus, emit MicroPython, compare to C)
// would be VACUOUS today: ZERO corpus examples declare a Pico servo/motor
// program, so it would find nothing and pass green forever, telling nobody it
// found nothing. Instead this records the zero WITH its cause. Two properties a
// green differential would not give:
//  - the day someone adds a Pico servo/motor example the count moves and this
//    reddens — which is the exact moment a corpus differential becomes worth
//    writing;
//  - a reader learns WHY there is no Pico servo/motor coverage (every such
//    example is an STC12 or Arduino program) instead of inferring, from a passing
//    test, that coverage exists.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
// The three device verbs that reach the servo/motor drivers, spelled as their
// parser accepts them — the whitespace before `angle`/`speed` is load-bearing:
// `set motor_angle to 0` is a VARIABLE write, not `set <servo> angle to <a>`.
const SERVO = /^\s*set\s+(.+?)\s+angle to\s+(.+)$/im;
const MOTOR = /^\s*set\s+(.+?)\s+speed to\s+(.+)$/im;
const DIR = /^\s*set\s+(.+?)\s+direction\s+(forward|reverse|brake|coast)\s*$/im;
const deviceOf = (src) => (src.match(/^\s*DEVICE\s+(\S+)/im) || [])[1];

function servoMotorExamples() {
    const out = [];
    for (const name of readdirSync(EXAMPLES, {withFileTypes: true}).filter((d) => d.isDirectory()).map((d) => d.name)) {
        const prog = join(EXAMPLES, name, 'program.bw');
        if (!existsSync(prog)) continue;
        const src = readFileSync(prog, 'utf8');
        if (SERVO.test(src) || MOTOR.test(src) || DIR.test(src)) {
            out.push({name, device: String(deviceOf(src) || '').toUpperCase()});
        }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}

test('P3p3: the servo/motor detector is not vacuous — it finds the real examples', () => {
    const found = servoMotorExamples();
    // Named rather than counted: a detector that matches nothing "proves" nothing
    // reaches. These two must be seen — a servo example (53-servo-sweep) AND a
    // motor example (54-motor-driver) — or the zero below is meaningless. Naming
    // them keeps the proof concrete without a bounding count the ratchet would owe.
    const names = found.map((e) => e.name);
    assert.ok(names.includes('53-servo-sweep'),
        `53-servo-sweep (a servo example) not detected — suspect the pattern: ${JSON.stringify(names)}`);
    assert.ok(names.includes('54-motor-driver'),
        `54-motor-driver (a motor example) not detected — suspect the pattern: ${JSON.stringify(names)}`);
});

test('P3p3: ZERO servo/motor examples reach the Pico path, BECAUSE all are STC12 or Arduino', () => {
    const found = servoMotorExamples();
    // Load-bearing: no Pico servo/motor example exists, so the generateMicroPython
    // servo/motor drivers have no corpus coverage. This is the assertion that
    // FAILS LOUDLY the day a Pico servo/motor example is added — the moment a real
    // corpus differential becomes worth writing.
    const pico = found.filter((e) => e.device === 'PICO');
    assert.deepEqual(pico, [],
        `a Pico servo/motor example now exists — the Pico MicroPython servo/motor path IS reached, so a `
        + `corpus differential is now worth writing: ${JSON.stringify(pico)}`);
    // Documentation: record WHICH devices carry servo/motor today, so the zero has
    // a written cause. Reddens if the set changes, prompting a re-read (a new
    // non-Pico device is fine; the recorded reason just moved).
    const devices = [...new Set(found.map((e) => e.device))].sort();
    assert.deepEqual(devices, ['ARDUINO-UNO', 'STC12C5A60S2'],
        `the devices that carry servo/motor examples changed — re-read the reachability note: `
        + JSON.stringify(found));
});
