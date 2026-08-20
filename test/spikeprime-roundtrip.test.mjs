/**
 * Spike Prime dialect round-trip: .bw → sb3 → .bw
 *
 * Parses a BrickWright program with Spike Prime verbs, generates an sb3
 * project, decompiles it back, and asserts the pseudocode reaches a fixed
 * point (decompile(parse(bw)) == decompile(parse(decompile(parse(bw))))).
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';

const here = dirname(fileURLToPath(import.meta.url));

function parse(bw) {
    const c = new SB3Creator();
    c.parse(bw);
    return c;
}

function roundTrip(bw) {
    const c1 = new SB3Creator();
    const dc1 = c1.decompile(c1.parse(bw));
    const c2 = new SB3Creator();
    const dc2 = c2.decompile(c2.parse(dc1));
    return { dc1, dc2, c1 };
}

const PROGRAMS = [
    {
        name: 'motor start/stop',
        bw: `DEVICE SPIKE

WHEN flag clicked:
  start motor A forward
  wait 2 seconds
  stop motor A`,
    },
    {
        name: 'display + sensor',
        bw: `DEVICE SPIKE

WHEN flag clicked:
  display text "Hello"
  set d to spike distance B
  display clear`,
    },
    {
        name: 'obstacle avoidance',
        bw: `DEVICE SPIKE

WHEN flag clicked:
  start motor A forward
  FOREVER:
    set dist to spike distance B
    IF dist < 15 THEN:
      stop motor A
      display text "!"
      wait 1 seconds
      display clear
      start motor A backward
      wait 0.5 seconds
      stop motor A
      start motor A forward
    wait 0.1 seconds`,
    },
    {
        name: 'full sensor suite',
        bw: `DEVICE SPIKE

WHEN flag clicked:
  set d to spike distance A
  set c to spike color A
  set f to spike force A
  set yaw to spike angle yaw
  set ax to spike acceleration x
  set pos to spike motor position A
  set spd to spike motor speed A
  set bat to spike battery`,
    },
];

describe('Spike Prime forward path', () => {
    for (const { name, bw } of PROGRAMS) {
        test(`${name}: parses with zero warnings`, () => {
            const c = parse(bw);
            assert.deepStrictEqual(c.warnings, [], `parse warnings: ${c.warnings}`);
        });

        test(`${name}: sb3 project has spikeprime extension`, () => {
            const c = parse(bw);
            assert.ok(
                c.project.extensions.includes('spikeprime'),
                `extensions: ${c.project.extensions}`
            );
        });
    }
});

describe('Spike Prime round-trip (.bw → project → .bw)', () => {
    for (const { name, bw } of PROGRAMS) {
        test(`${name}: decompile reaches a fixed point`, () => {
            const { dc1, dc2 } = roundTrip(bw);
            assert.equal(dc2, dc1,
                `\n--- first decompile ---\n${dc1}\n--- second decompile ---\n${dc2}`);
        });
    }
});

describe('Spike Prime command decompile spot-checks', () => {
    test('motorStart: start motor A forward', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  start motor A forward\n');
        assert.ok(dc1.includes('start motor A forward'), `got:\n${dc1}`);
    });

    test('motorStop: stop motor A', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  stop motor A\n');
        assert.ok(dc1.includes('stop motor A'), `got:\n${dc1}`);
    });

    test('displayText: display text "Hello"', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  display text "Hello"\n');
        assert.ok(dc1.includes('display text "Hello"'), `got:\n${dc1}`);
    });

    test('displayClear: display clear', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  display clear\n');
        assert.ok(dc1.includes('display clear'), `got:\n${dc1}`);
    });

    test('resetYaw: reset yaw', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  reset yaw\n');
        assert.ok(dc1.includes('reset yaw'), `got:\n${dc1}`);
    });

    test('resetTimer: reset spike timer', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  reset spike timer\n');
        assert.ok(dc1.includes('reset spike timer'), `got:\n${dc1}`);
    });

    test('stopMovement: stop movement', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  stop movement\n');
        assert.ok(dc1.includes('stop movement'), `got:\n${dc1}`);
    });

    test('motorRunFor: run motor B forward 3 rotation', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  run motor B forward 3 rotation\n');
        assert.ok(dc1.includes('run motor B forward 3 rotation'), `got:\n${dc1}`);
    });

    test('moveForward: move forward 10 cm', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  move forward 10 cm\n');
        assert.ok(dc1.includes('move forward 10 cm'), `got:\n${dc1}`);
    });
});

describe('Spike Prime reporter decompile spot-checks', () => {
    test('getDistance reporter', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  set d to spike distance B\n');
        assert.ok(dc1.includes('spike distance B'), `got:\n${dc1}`);
    });

    test('getColor reporter', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  set c to spike color A\n');
        assert.ok(dc1.includes('spike color A'), `got:\n${dc1}`);
    });

    test('getAngle reporter', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  set y to spike angle yaw\n');
        assert.ok(dc1.includes('spike angle yaw'), `got:\n${dc1}`);
    });

    test('getAcceleration reporter', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  set a to spike acceleration x\n');
        assert.ok(dc1.includes('spike acceleration x'), `got:\n${dc1}`);
    });

    test('getBatteryLevel reporter', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  set b to spike battery\n');
        assert.ok(dc1.includes('spike battery'), `got:\n${dc1}`);
    });

    test('getTimer reporter', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  set t to spike timer\n');
        assert.ok(dc1.includes('spike timer'), `got:\n${dc1}`);
    });

    test('getPosition reporter', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  set p to spike motor position A\n');
        assert.ok(dc1.includes('spike motor position A'), `got:\n${dc1}`);
    });

    test('getSpeed reporter', () => {
        const { dc1 } = roundTrip('DEVICE SPIKE\n\nWHEN flag clicked:\n  set s to spike motor speed A\n');
        assert.ok(dc1.includes('spike motor speed A'), `got:\n${dc1}`);
    });
});

describe('Gallery example: spike01-obstacle-avoid', () => {
    test('example parses and reaches a fixed point', () => {
        const bw = readFileSync(resolve(here, '../examples/spike01-obstacle-avoid/program.bw'), 'utf8');
        const { dc1, dc2, c1 } = roundTrip(bw);
        assert.deepStrictEqual(c1.warnings, [], `parse warnings: ${c1.warnings}`);
        assert.equal(dc2, dc1, 'fixed point');
        assert.ok(c1.project.extensions.includes('spikeprime'), 'has spikeprime extension');
    });
});
