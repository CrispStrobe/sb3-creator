/**
 * LEGO SPIKE App 3 Python <-> the SPIKE dialect (src/utils/spike3Python.js).
 *
 * What is held here:
 *  - the API ledger is TRUE of the reader, function by function: a `mapped`
 *    sample translates with no note and nothing unsupported, an `approximate`
 *    one with a note, an `unsupported` one names exactly that function;
 *  - the units the reader converts (velocity, yaw, distance, time) and the
 *    ordering it keeps (await sequence, concurrent runloop entries);
 *  - the corpus: every program compiles with no warnings, names what it cannot
 *    express, and blocks -> Python -> blocks is a fixed point;
 *  - the Python entry point routes SPIKE 3 here and nothing else.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import SB3Creator from '../src/utils/sb3Creator.js';
import pythonToPseudocode from '../src/utils/pythonToPseudocode.js';
import {
    SPIKE3_API, spike3PythonToPseudocode, projectToSpike3Python, isSpike3Python, VELOCITY_PER_PERCENT
} from '../src/utils/spike3Python.js';

const PRELUDE = [
    'import hub',
    'from hub import port, light_matrix, sound, motion_sensor, button, light',
    'import motor, motor_pair, color_sensor, distance_sensor, force_sensor, color, runloop',
    ''
].join('\n');
const inMain = (...lines) => `${PRELUDE}\nasync def main():\n${lines.map((l) => `    ${l}`).join('\n')}\n\nrunloop.run(main())\n`;

const compile = (pseudocode) => {
    const c = new SB3Creator();
    const project = c.parse(pseudocode);
    return { c, project, blocks: project.targets.flatMap((t) => Object.values(t.blocks || {})) };
};
const spikeOps = (blocks) => blocks.filter((b) => b && /^spikeprime_/.test(b.opcode));
const lit = (input) => (Array.isArray(input) && Array.isArray(input[1]) ? Number(input[1][1]) : null);
const body = (pseudo) => pseudo.split('\n').map((l) => l.trim()).filter(Boolean);

/** py -> pseudo -> blocks -> py, twice. */
function trip (py) {
    const r = pythonToPseudocode(py);
    const { c, project } = compile(r.pseudocode);
    const decompiled = c.decompile(project);
    const out = projectToSpike3Python(project);
    return { r, c, project, decompiled, py: out.py, exportUnsupported: out.unsupported };
}

describe('the API ledger is true of the reader', () => {
    for (const [fn, [status, sample]] of Object.entries(SPIKE3_API)) {
        if (!sample) continue;
        test(`${fn}: ${status}`, () => {
            const r = spike3PythonToPseudocode(inMain('motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)', sample));
            const { c } = compile(r.pseudocode);
            assert.deepEqual(c.warnings, [], `compiles cleanly:\n${r.pseudocode}`);
            if (status === 'unsupported') {
                assert.equal(r.unsupported.length, 1, `exactly one refusal: ${r.unsupported}`);
                const short = fn.replace(/^hub\.(?=\w+\.)/, '');
                assert.ok(r.unsupported[0].startsWith(short), `names ${short}: ${r.unsupported[0]}`);
                assert.match(r.pseudocode, /# unsupported: /, 'and says so in the program');
            } else {
                assert.deepEqual(r.unsupported, [], `${fn} maps`);
                if (status === 'mapped') assert.deepEqual(r.notes, [], `${fn} is exact`);
                else assert.ok(r.notes.length > 0, `${fn} says what it approximates`);
            }
        });
    }
    test('every module in LEGO\'s reference is in the ledger', () => {
        const modules = new Set(Object.keys(SPIKE3_API).map((k) => k.split('.').slice(0, -1).join('.')));
        for (const m of ['motor', 'motor_pair', 'color_sensor', 'distance_sensor', 'force_sensor', 'hub', 'hub.button',
            'hub.light', 'hub.light_matrix', 'hub.sound', 'hub.motion_sensor', 'runloop']) assert.ok(modules.has(m), m);
    });
});

describe('units and scales', () => {
    test('motor_pair.move_for_degrees: the pair, the speed, the steering and the wheel degrees reach the blocks', () => {
        const r = spike3PythonToPseudocode(inMain('motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)',
            'await motor_pair.move_for_degrees(motor_pair.PAIR_1, 720, 0, velocity=555)'));
        const { c, project, blocks } = compile(r.pseudocode);
        assert.deepEqual(c.warnings, []);
        const ops = spikeOps(blocks);
        const pair = ops.find((b) => b.opcode === 'spikeprime_setMovementMotors');
        const byId = Object.assign({}, ...project.targets.map((t) => t.blocks));
        const menu = (input) => byId[input[1]].fields.PORT[0];
        assert.deepEqual([menu(pair.inputs.PORT_A), menu(pair.inputs.PORT_B)], ['A', 'B']);
        const speed = ops.find((b) => b.opcode === 'spikeprime_setMovementSpeed');
        assert.equal(lit(speed.inputs.SPEED), 555 / VELOCITY_PER_PERCENT, '555 deg/s is half the medium motor\'s full speed');
        assert.equal(lit(speed.inputs.SPEED), 50);
        assert.equal(lit(ops.find((b) => b.opcode === 'spikeprime_steer').inputs.STEERING), 0);
        assert.ok(ops.some((b) => b.opcode === 'spikeprime_stopMovement'));
        const lines = body(r.pseudocode);
        const at = (re) => lines.findIndex((l) => re.test(l));
        const start = at(/^start moving steering 0$/);
        const wait = at(/^wait until .*spike motor relative position A.*< 720.*spike motor relative position B.*< 720/);
        const stop = at(/^stop movement$/);
        assert.ok(at(/^set spike_left\d+ to \(spike motor relative position A\)$/) < start, 'starting angle read before the move');
        assert.ok(start > 0 && wait > start && stop > wait, r.pseudocode);
    });
    test('a negative degree count or velocity drives backward, both negative forward', () => {
        const speed = (deg, v) => {
            const r = spike3PythonToPseudocode(inMain('motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)',
                `await motor_pair.move_for_degrees(motor_pair.PAIR_1, ${deg}, 0, velocity=${v})`));
            return lit(spikeOps(compile(r.pseudocode).blocks).find((b) => b.opcode === 'spikeprime_setMovementSpeed').inputs.SPEED);
        };
        assert.equal(speed(360, 333), 30);
        assert.equal(speed(-360, 333), -30);
        assert.equal(speed(360, -333), -30);
        assert.equal(speed(-360, -333), 30);
    });
    test('a steered move_for_degrees steers the drive base, waits for either wheel, then stops', () => {
        const r = spike3PythonToPseudocode(inMain('motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)',
            'await motor_pair.move_for_degrees(motor_pair.PAIR_1, 180, 50, velocity=333)'));
        const lines = body(r.pseudocode);
        const at = (re) => lines.findIndex((l) => re.test(l));
        const speed = at(/^set movement speed 30$/);
        const start = at(/^start moving steering 50$/);
        const wait = at(/^wait until .*spike motor relative position A.*< 180.*spike motor relative position B.*< 180/);
        const stop = at(/^stop movement$/);
        assert.ok(speed >= 0 && start > speed && wait > start && stop > wait, r.pseudocode);
    });
    test('move_for_time is start, wait the time, stop', () => {
        const r = spike3PythonToPseudocode(inMain('motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)',
            'await motor_pair.move_for_time(motor_pair.PAIR_1, 1500, -20)'));
        assert.deepEqual(body(r.pseudocode).slice(-4), ['set movement speed 32.4324', 'start moving steering -20', 'wait 1.5 seconds', 'stop movement']);
    });
    test('motor.run_for_degrees: degrees and deg/s -> degrees and percent', () => {
        const r = spike3PythonToPseudocode(inMain('await motor.run_for_degrees(port.C, -90, 444)'));
        assert.deepEqual(body(r.pseudocode).slice(-2), ['set motor speed C 40', 'run motor C backward 90 degrees']);
    });
    test('yaw: tilt_angles() is decidegrees with the app\'s sign inverted', () => {
        const r = spike3PythonToPseudocode(inMain('heading = motion_sensor.tilt_angles()[0]'));
        assert.ok(body(r.pseudocode).includes('set heading to (0 - (spike angle yaw)) * 10'), r.pseudocode);
        const reset = spike3PythonToPseudocode(inMain('motion_sensor.reset_yaw(450)'));
        assert.ok(body(reset.pseudocode).includes('preset yaw to -45'), reset.pseudocode);
        assert.ok(body(spike3PythonToPseudocode(inMain('motion_sensor.reset_yaw(0)')).pseudocode).includes('reset yaw'));
    });
    test('distance is millimetres, read through the mm block', () => {
        const r = spike3PythonToPseudocode(inMain('d = distance_sensor.distance(port.D)'));
        const [b] = spikeOps(compile(r.pseudocode).blocks);
        assert.equal(b.opcode, 'spikeprime_getDistanceIn');
        assert.equal(b.fields.UNIT[0], 'mm');
        assert.ok(r.notes.some((n) => /-1/.test(n)), 'the -1 difference is stated');
    });
    test('sleep_ms is milliseconds; the blocks wait in seconds', () => {
        const r = spike3PythonToPseudocode(inMain('await runloop.sleep_ms(250)'));
        assert.ok(body(r.pseudocode).includes('wait 0.25 seconds'));
    });
    test('color compared with a color constant is the isColor boolean', () => {
        const r = spike3PythonToPseudocode(inMain('if color_sensor.color(port.C) is color.RED:', '    motor.stop(port.A)'));
        assert.ok(body(r.pseudocode).includes('IF spike color C is red THEN:'), r.pseudocode);
        const ops = spikeOps(compile(r.pseudocode).blocks).map((b) => b.opcode);
        assert.ok(ops.includes('spikeprime_isColor'));
    });
});

describe('ordering', () => {
    test('awaited calls stay in order', () => {
        const r = spike3PythonToPseudocode(inMain(
            'await light_matrix.write("1")', 'await runloop.sleep_ms(100)', 'await sound.beep(440, 100)', 'light_matrix.clear()'));
        const lines = body(r.pseudocode);
        const i = (s) => lines.indexOf(s);
        assert.ok(i('display text "1"') < i('wait 0.1 seconds') && i('wait 0.1 seconds') < i('play beep 440 100') &&
            i('play beep 440 100') < i('display clear'), r.pseudocode);
    });
    test('runloop.run(a(), b()) is two scripts that start together', () => {
        const src = `${PRELUDE}\nasync def a():\n    motor.run(port.A, 100)\n\nasync def b():\n    motor.run(port.B, 100)\n\nrunloop.run(a(), b())\n`;
        const r = spike3PythonToPseudocode(src);
        assert.equal(r.pseudocode.match(/^WHEN flag clicked:$/gm).length, 2);
        const { project } = compile(r.pseudocode);
        const hats = project.targets.flatMap((t) => Object.values(t.blocks)).filter((b) => b.opcode === 'event_whenflagclicked');
        assert.equal(hats.length, 2);
    });
    test('an awaitable called without await is named as a change of timing', () => {
        const r = spike3PythonToPseudocode(inMain('motor.run_for_degrees(port.A, 90, 300)'));
        assert.ok(r.notes.some((n) => /without await/.test(n)), r.notes.join('\n'));
    });
    test('an awaited helper is a custom block called in place', () => {
        const src = `${PRELUDE}\nasync def spin(deg):\n    await motor.run_for_degrees(port.A, deg, 300)\n\nasync def main():\n    await spin(90)\n    await spin(180)\n\nrunloop.run(main())\n`;
        const r = spike3PythonToPseudocode(src);
        assert.ok(/^DEFINE spin \(deg\):$/m.test(r.pseudocode), r.pseudocode);
        const lines = body(r.pseudocode);
        assert.ok(lines.indexOf('spin 90') < lines.indexOf('spin 180'));
        const { c, blocks } = compile(r.pseudocode);
        assert.deepEqual(c.warnings, []);
        assert.equal(blocks.filter((b) => b.opcode === 'procedures_call').length, 2);
    });
    test('a break is a flag, and what follows it in the loop is guarded', () => {
        const r = spike3PythonToPseudocode(inMain('while True:', '    motor.run(port.B, 200)', '    if force_sensor.pressed(port.E):',
            '        break', '    motor.run(port.A, 111)'));
        assert.deepEqual(r.unsupported, []);
        assert.match(r.pseudocode, /REPEAT UNTIL spike_done\d+ = 1:/);
        assert.match(r.pseudocode, /IF spike_done\d+ = 0 THEN:\n\s+set motor speed A 10/);
        const { c } = compile(r.pseudocode);
        assert.deepEqual(c.warnings, []);
    });
    test('a break on the loop\'s first line is the loop\'s own condition', () => {
        const r = spike3PythonToPseudocode(inMain('while True:', '    if force_sensor.pressed(port.E):',
            '        break', '    motor.run(port.A, 111)'));
        assert.match(r.pseudocode, /REPEAT UNTIL spike force sensor E pressed:\n\s+set motor speed A 10/);
    });
});

const CORPUS = new URL('./fixtures/spike3-python/', import.meta.url);
/** What each corpus program cannot say — a change here is a change in coverage. */
const EXPECTED_UNSUPPORTED = {
    '07-light-matrix.py': ['light_matrix.show()'],
    '12-unsupported-mix.py': ['light.color()', 'color_sensor.rgbi() unpacked into names', 'distance_sensor.show()', 'sound.volume()']
};

describe('corpus', () => {
    const files = readdirSync(CORPUS).filter((f) => f.endsWith('.py')).sort();
    test('the corpus is there', () => assert.ok(files.length >= 12, `counted 12 programs on 2026-09-28; found: ${files.join()}`));
    for (const f of files) {
        test(`${f}: compiles, names what it cannot say, and round-trips`, () => {
            const src = readFileSync(new URL(f, CORPUS), 'utf8');
            assert.ok(isSpike3Python(src));
            const a = trip(src);
            assert.deepEqual(a.c.warnings, [], `compiles:\n${a.r.pseudocode}`);
            assert.deepEqual(a.r.unsupported, EXPECTED_UNSUPPORTED[f] || []);
            const refusals = (a.r.pseudocode.match(/# unsupported: /g) || []).length;
            assert.equal(refusals, a.r.unsupported.length, 'every refusal is visible in the program');
            assert.deepEqual(a.exportUnsupported, []);
            const b = trip(a.py);
            assert.deepEqual(b.r.unsupported, []);
            assert.deepEqual(b.c.warnings, []);
            assert.equal(b.py, a.py, 'blocks -> SPIKE 3 Python -> blocks -> SPIKE 3 Python is a fixed point');
            if (!a.r.unsupported.length) assert.equal(b.decompiled, a.decompiled, 'and so are the blocks');
        });
    }
});

describe('print', () => {
    test('print(a, b) joins with a space, as Python does', () => {
        const r = spike3PythonToPseudocode(inMain('d = 5', 'print("mm", d)'));
        assert.ok(body(r.pseudocode).includes('say (("mm" join " ") join d)'), r.pseudocode);
        assert.deepEqual(compile(r.pseudocode).c.warnings, []);
        const { project } = compile(r.pseudocode);
        const sayer = project.targets.find((t) => Object.values(t.blocks).some((b) => b.opcode === 'looks_say'));
        assert.equal(sayer.isStage, false, 'a program that prints runs on a sprite: the Stage has no speech bubble');
        assert.equal(sayer.name, 'Hub');
    });
});

describe('export', () => {
    test('a boolean reporter used as a condition is exported as the truth value itself', () => {
        const { project } = compile('DEVICE SPIKE\n\nWHEN flag clicked:\n  IF spike force sensor E pressed THEN:\n    stop motor A\n' +
            '  wait until not (spike color C is red)\n');
        const { py, unsupported } = projectToSpike3Python(project);
        assert.deepEqual(unsupported, []);
        assert.match(py, /^\s+if force_sensor\.pressed\(port\.E\):$/m);
        assert.match(py, /runloop\.until\(lambda: \(not \(color_sensor\.color\(port\.C\) == color\.RED\)\)\)/);
        assert.doesNotMatch(py, /== "true"/, 'True == "true" is False in Python');
    });
    test('speeds carry through the _bw_speed evidence, in deg/s at the stated scale', () => {
        const { project } = compile('DEVICE SPIKE\n\nWHEN flag clicked:\n  set motor speed B 40\n  run motor B backward 2 rotations\n');
        const { py } = projectToSpike3Python(project);
        assert.match(py, /_bw_speed\[port\.B\] = 40\n\s+await motor\.run_for_degrees\(port\.B, 2 \* 360, _bw_speed\[port\.B\] \* -11\.1\)/);
    });
});

describe('routing through the Python entry point', () => {
    test('SPIKE 3 imports route here', () => {
        const r = pythonToPseudocode('import runloop\nfrom hub import light_matrix\n\nasync def main():\n    light_matrix.clear()\n\nrunloop.run(main())\n');
        assert.equal(r.dialect, 'spike3');
        assert.match(r.pseudocode, /^DEVICE SPIKE/);
    });
    test('plain Python and micro:bit MicroPython do not', () => {
        assert.equal(isSpike3Python('x = 1\nprint(x)\n'), false);
        assert.equal(isSpike3Python('from microbit import *\ndisplay.show(1)\n'), false);
        assert.equal(isSpike3Python('from pybricks.hubs import PrimeHub\n'), false);
        assert.equal(isSpike3Python('from spike import PrimeHub\n'), false, 'SPIKE 2 (legacy) is a different API');
        assert.equal(pythonToPseudocode('x = 1\nprint(x)\n').dialect, undefined);
    });
});
