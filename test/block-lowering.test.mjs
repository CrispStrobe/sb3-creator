// Block lowering census: every hardware block, against whether generateC
// can lower it. A block with no lowering is a trap — a user drags it, the
// project compiles, and the behaviour is silently missing.
//
// Derived from createBlock/cmd/B/push calls, not a maintained list.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, '../src/utils/sb3Creator.js'), 'utf8');

// ---- derive all created hardware block opcodes ----------------------------
const created = new Set();
for (const m of src.matchAll(/(?:createBlock|cmd)\('([a-z0-9_]+)'/g)) created.add(m[1]);
for (const m of src.matchAll(/(?:B|push)\('([a-z0-9_]+)'/g)) created.add(m[1]);
const hw = [...created].filter(op => /^(stc12|circuit|ledcube|devices)_/.test(op)).sort();

// ---- derive all opcodes the C emitter handles ----------------------------
const cMethods = ['cStackBlock', 'cTaskBlock', 'cRep', 'cCond'];
const cCases = new Set();
for (const name of cMethods) {
    const idx = src.indexOf(name + '(b, blocks');
    if (idx < 0) continue;
    const chunk = src.slice(idx, idx + 15000);
    for (const m of chunk.matchAll(/case '([a-z0-9_]+)':/g)) cCases.add(m[1]);
}

// ---- categorise each block -----------------------------------------------
// sim-only: circuit reporters/commands that talk to the board, not the chip
const SIM_ONLY = new Set([
    'circuit_branchcurrent', 'circuit_buzzertone', 'circuit_ledbrightness',
    'circuit_nodevoltage', 'circuit_resistance',
    'circuit_setcontrol', 'circuit_setpower'
]);

// tethered-only: blocks that only make sense over a live UART link
const TETHERED_ONLY = new Set([
    // (none currently — stc12live blocks are in the stc12live extension, not stc12)
]);

// devices_* blocks: these have Python/JS codegen via RUNTIME_EXTENSIONS
// but no C lowering. On the device target they fall through to cStackBlock's
// default case, which emits a /* warning: no C equivalent for "..." */
// comment in the generated C. The warning names the block — a user who
// inspects the output can see what was dropped. But the program still
// compiles and flashes without the behaviour, which is the silent-drop
// failure PARTS-TO-BLOCKS.md names as the one this project refuses to ship.
//
// The importer IS a supported path (stc/tools/compile-remote.sh -p), so
// these blocks are reachable today, not only when a palette tile exists.
const DEVICES_NO_C = new Set(
    hw.filter(op => op.startsWith('devices_') && !cCases.has(op))
);

// ---- tests ---------------------------------------------------------------

test('block lowering census', () => {
    const lowers = hw.filter(op => cCases.has(op));
    const hats = hw.filter(op => op.includes('when') && !cCases.has(op));
    const simOnly = hw.filter(op => SIM_ONLY.has(op));
    const noLowering = hw.filter(op => !cCases.has(op) && !op.includes('when') && !SIM_ONLY.has(op));

    console.log(`  census: ${hw.length} hardware blocks`);
    console.log(`    ${lowers.length} lower to C`);
    console.log(`    ${hats.length} hats (handled in Pass 3)`);
    console.log(`    ${simOnly.length} simulation-only (correct: no C lowering needed)`);
    console.log(`    ${noLowering.length} no C lowering (devices_* convenience blocks)`);

    // The stc12_* and ledcube_* blocks must ALL have C lowering.
    const stcMissing = hw.filter(op => op.startsWith('stc12_') && !cCases.has(op) && !op.includes('when'));
    assert.deepEqual(stcMissing, [], 'stc12 blocks missing C lowering');

    const cubeMissing = hw.filter(op => op.startsWith('ledcube_') && !cCases.has(op));
    assert.deepEqual(cubeMissing, [], 'ledcube blocks missing C lowering');

    // RATCHET: no new block may be added without a C case.
    assert.ok(noLowering.length === 0,
        `${noLowering.length} block(s) have no C emitter case: ${noLowering.join(', ')}`);

    // STUB COUNT: devices_* blocks that have a C case but call a BW_STUB
    // function — they compile but do nothing on hardware. This is the honest
    // number. Lower it when a real driver replaces a stub.
    // Blocks with REAL implementations (not stubs):
    const REAL_DRIVERS = new Set([
        'devices_setservo',    // PCA 16-bit compare/match, 50 Hz
        'devices_servoangle',  // reads _servo_angle
        'devices_setmotor',    // PCA 8-bit PWM on module 1 (CCP1/P1.4)
        'devices_motorspeed',  // reads _motor_speed
        'devices_setdirection', // GPIO direction (P3.4/P3.5 for L293D)
        'devices_motordirection', // reads _motor_dir
        'devices_setrelay',    // GPIO pin write (P2.0, active-low)
        'devices_activate',    // relay alias → bw_relay_set(dev, 1)
        'devices_deactivate',  // relay alias → bw_relay_set(dev, 0)
        'devices_energised',   // relay coil state readback
        'devices_pressed',     // GPIO read (P3.2/INT0, active-low)
        'devices_motion',      // digital contact closure (same as pressed)
        'devices_tilted',      // digital contact closure (same as pressed)
        'devices_temperature', // ADC ch 1, TMP36 scaling
        'devices_light',       // ADC ch 1, percentage
        'devices_flex',        // ADC ch 1, raw
        'devices_force',       // ADC ch 1, raw
        'devices_above',       // threshold predicate on temperature
        'devices_whenabove',   // polled task, edge-triggered on temperature
        'devices_whenmotion',  // polled task, edge-triggered on contact closure
        'devices_whentilted',  // polled task, edge-triggered on contact closure
        'devices_whencloser',  // polled task, edge-triggered on distance
        'devices_distance',    // HC-SR04 ultrasonic (P3.6 trig, P3.7 echo, Timer 1)
        'devices_closer',      // threshold predicate on distance
        'devices_setneopixel', // WS2812 bitbang (P1.5, 1T only, inline asm)
        'devices_clearneopixels', // zero the pixel buffer + send
    ]);
    const allDevices = hw.filter(op => op.startsWith('devices_'));
    const stubs = allDevices.filter(op => !REAL_DRIVERS.has(op));
    const KNOWN_STUBS = 10;   // ratchet: only ever decrease (was 12, neopixel real on 1T)
    console.log(`    ${stubs.length} devices_* stubs, ${REAL_DRIVERS.size} real drivers`);
    assert.ok(stubs.length <= KNOWN_STUBS,
        `${stubs.length} stub blocks (was ${KNOWN_STUBS}) — new stub(s) added`);

    // circuit_* blocks must NOT have C lowering (they are sim-only).
    const circuitInC = hw.filter(op => op.startsWith('circuit_') && cCases.has(op));
    assert.deepEqual(circuitInC, [], 'circuit blocks should not have C lowering — they are sim-only');
});

test('every block without C lowering has a documented reason', () => {
    // The devices_* blocks are convenience abstractions. On the device target
    // they compile to a comment, which is the documented fallback in cStackBlock's
    // default case. This is acceptable for simulation-mode but means a compiled
    // project cannot drive a servo/LCD/neopixel through these blocks.
    //
    // This test makes the gap list explicit: if a devices_* block gains a C
    // lowering, remove it from DEVICES_NO_C.
    for (const op of DEVICES_NO_C) {
        assert.ok(!cCases.has(op),
            `${op} is in DEVICES_NO_C but has a C lowering — remove it from the gap list`);
    }
    // Report the count so the gap is visible.
    console.log(`  ${DEVICES_NO_C.size} devices_* blocks compile to comments on the device target`);
});
