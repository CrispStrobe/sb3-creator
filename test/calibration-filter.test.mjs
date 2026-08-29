/**
 * `arduino-03-calibration` has a filter, and it is the same filter on both sides.
 *
 * THE DEFECT (D32)
 * ----------------
 * The lesson `interactive-calibration-control` asks the learner to "state the
 * moving-average length you would add and the delay it would cost". The bench
 * it names had no filter at all, so the answer had nothing to be checked
 * against — the checkpoint could accept any number, including a wrong one. The
 * lesson's hint had been re-worded around the gap ("This program has no filter
 * at all"), which makes the exercise legible but leaves the defect in the
 * bench.
 *
 * WHY A SHIFT REGISTER AND NOT A LIST
 * -----------------------------------
 * The obvious implementation is the one `arduino-03-smoothing` already uses: a
 * ring buffer in a list. Measured, that lowers to NOTHING on the device — the C
 * emitter has no lists, so `item (readIndex + 1) of readings` emits
 * `0 /* … *\/` and the whole average collapses to a constant. It says so, in
 * four emitted warnings, but a filter that exists in the simulator and not on
 * the chip is the defect class this repo has already paid for twice
 * (`vm-and-c-agree-on-arithmetic.test.mjs`). Four explicit `sampleN` variables
 * lower to four `long` assignments and mean the same thing in both.
 *
 * WHAT IS PINNED, AND WHY THESE NUMBERS
 * -------------------------------------
 * A 4-tap boxcar on a 20 ms loop. Hand-computed, with a 0 -> 5 V step on A0
 * after a 0 V / 5 V calibration (so sensorMin = 0, sensorMax = 1023 and the
 * mapping is `reading * 100 / 1023`), the output must climb one quarter of the
 * step per pass:
 *
 *     1023 * 1 / 4 = 255  ->  255 * 100 / 1023 =  24 %   (integer division)
 *     1023 * 2 / 4 = 511  ->  511 * 100 / 1023 =  49 %
 *     1023 * 3 / 4 = 767  ->  767 * 100 / 1023 =  74 %
 *     1023 * 4 / 4 = 1023 -> 1023 * 100 / 1023 = 100 %
 *
 * so the settling time is 4 x 20 ms = 80 ms from the last unaffected sample to
 * the first fully settled one, and the group delay of an N-tap boxcar is
 * (N - 1) / 2 = 1.5 samples = 30 ms. Those are the two numbers the lesson asks
 * the learner to produce, and they are now derivable from the bench.
 *
 * THE MUTATION: delete the four `set sampleN` lines and read the sensor
 * straight into `sensorValue`, and the staircase becomes a single 0 -> 100 step
 * — this file's first test goes red on the shape, not on a threshold.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';
import { interpretTrace } from '../src/utils/traceOracle.js';

const PROGRAM = join(import.meta.dirname, '..', 'examples', 'arduino-03-calibration', 'program.bw');

/** The step experiment, on the referee. Times are absolute program milliseconds. */
const STIMULUS = [
    { tMs: 0, pin: 'sensor', volts: 0 },       // calibration sees the bottom
    { tMs: 2000, pin: 'sensor', volts: 5 },    // …and the top: min 0, max 1023
    { tMs: 4900, pin: 'sensor', volts: 0 },    // back to the bottom before the run loop
    { tMs: 6000, pin: 'sensor', volts: 5 },    // the step under measurement
];

function traceCalibration (source) {
    const creator = new SB3Creator();
    const project = creator.parse(source);
    assert.deepEqual(creator.warnings, [], `the bench must parse clean: ${creator.warnings.join('; ')}`);
    const trace = interpretTrace(project, {
        horizonMs: 6400,
        stimulus: STIMULUS,
        adc: { bits: 10, vref: 5 },
        maxSteps: 5000000,
    });
    assert.deepEqual(trace.unsupported, [], 'the referee must speak every opcode this bench uses');
    return trace;
}

/** The duty the LED is driven to at each 20 ms tick in [from, to]. */
const dutyWindow = (trace, from, to) => trace.pwm
    .filter((e) => e.pin === 'led' && e.tMs >= from && e.tMs <= to)
    .map((e) => [e.tMs, e.percent]);

describe('arduino-03-calibration filters, and the delay it costs is measurable', () => {
    const source = readFileSync(PROGRAM, 'utf8');

    test('the step climbs in four equal quarters, 80 ms end to end', () => {
        const climb = dutyWindow(traceCalibration(source), 5980, 6060);
        assert.deepEqual(climb, [[5980, 0], [6000, 24], [6020, 49], [6040, 74], [6060, 100]],
            'a 4-tap boxcar on a 20 ms loop must let a step through one quarter at a time. '
            + 'A single 0 -> 100 jump means the filter is gone; a longer ramp means the window '
            + 'changed and the two numbers the lesson asks for changed with it.');
    });

    test('the settling time and the group delay are the ones the bench states', () => {
        const trace = traceCalibration(source);
        const led = trace.pwm.filter((e) => e.pin === 'led' && e.tMs >= 5000);
        const lastBefore = led.filter((e) => e.percent === 0).at(-1);
        const firstSettled = led.find((e) => e.tMs > lastBefore.tMs && e.percent === 100);
        assert.equal(firstSettled.tMs - lastBefore.tMs, 80,
            'settling time = window x loop period = 4 x 20 ms');

        // Group delay of an N-tap boxcar is (N-1)/2 samples. Read off the trace
        // as the first sample at or past half the step, relative to the first
        // sample that moved at all: 1.5 samples, which lands between them.
        const firstMoved = led.find((e) => e.tMs > lastBefore.tMs && e.percent > 0);
        const firstHalf = led.find((e) => e.tMs > lastBefore.tMs && e.percent >= 50);
        const lag = firstHalf.tMs - firstMoved.tMs;
        assert.ok(lag === 20 || lag === 40,
            `the 50 % crossing must bracket (N-1)/2 x 20 ms = 30 ms; measured ${lag} ms`);
    });

    test('the filter is in the emitted device C, not only in the simulator', () => {
        const creator = new SB3Creator();
        creator.parse(source);
        const c = creator.generateC();
        assert.match(c, /@bw-begin/, 'this bench targets a device');
        // Four taps, shifted, then averaged — as arithmetic the emitter can lower.
        for (const line of [/s0_sample4 = s0_sample3;/, /s0_sample3 = s0_sample2;/,
            /s0_sample2 = s0_sample1;/, /s0_sample1 = adc_read\(0\);/]) {
            assert.match(c, line, 'the shift register must survive into the device C');
        }
        assert.match(c, /s0_sensorValue = \(\(\(s0_sample1 \+ s0_sample2\) \+ \(s0_sample3 \+ s0_sample4\)\) \/ 4\);/,
            'the average must be emitted arithmetic');
        // And the thing that made the list form unusable must not be back.
        assert.ok(!/no C equivalent for "item /.test(c),
            'a list-based filter lowers to a constant 0 on the device: the emitter has no lists, '
            + 'and it says so in a warning that reads like prose. Keep the shift register.');
    });
});
