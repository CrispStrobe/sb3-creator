/**
 * microbitPlus — sb3-creator-side extension scaffold.
 *
 * This module registers the microbitPlus block metadata so that:
 *   1. The oracle test (test/microbit-oracle.test.mjs) un-gates.
 *   2. generateMicroPython() can map microbitplus_* opcodes to MicroPython.
 *   3. The dialect parser can round-trip dialect ↔ blocks.
 *
 * The block definitions here mirror the VM-side extension in
 * overlay/scratch-vm/src/extensions/crispstrobe/microbitplus/index.js
 * (brickwright-lite repo, branch feat/microbitplus-groups).
 *
 * Execution model: these blocks lower to MicroPython and run inside the
 * micro:bit simulator — the opcode methods are no-ops on the Scratch VM
 * stage. The real lowering is in sb3Creator.js's generateMicroPython()
 * (display group landed; pins/actuators/radio groups pending bw-audit).
 *
 * Provenance: block envelope adapted from MIT mbit-more (Koji Yokokawa);
 * no firmware or protocol code. See stc/docs/MICROBIT-EXTENSION-STUDY.md §6.
 */

// The extension ID must match the VM-side registration.
export const EXTENSION_ID = 'microbitplus';

// The v1 block set — 40 blocks across 7 groups.
// Each entry: { opcode, group, blockType, args }
// Groups: display, events, sensors, pins, actuators, radio, connection
export const BLOCK_TABLE = [
    // ── Display ─────────────────────────────────────────────────
    { opcode: 'showmatrix', group: 'display', type: 'command', args: ['MATRIX'] },
    { opcode: 'showtext', group: 'display', type: 'command', args: ['TEXT'] },
    { opcode: 'scrolltext', group: 'display', type: 'command', args: ['TEXT', 'MS'] },
    { opcode: 'cleardisplay', group: 'display', type: 'command', args: [] },
    { opcode: 'plot', group: 'display', type: 'command', args: ['X', 'Y', 'STATE'] },

    // ── Events: buttons, logo, gestures ─────────────────────────
    { opcode: 'whenbutton', group: 'events', type: 'hat', args: ['BTN', 'BTNEVENT'] },
    { opcode: 'isbutton', group: 'events', type: 'boolean', args: ['BTN'] },
    { opcode: 'whenlogo', group: 'events', type: 'hat', args: ['LOGOEVENT'] },
    { opcode: 'whengesture', group: 'events', type: 'hat', args: ['GESTURE'] },
    { opcode: 'isgesture', group: 'events', type: 'boolean', args: ['GESTURE'] },

    // ── Sensors: motion ─────────────────────────────────────────
    { opcode: 'accel', group: 'sensors', type: 'reporter', args: ['AXIS'] },
    { opcode: 'pitch', group: 'sensors', type: 'reporter', args: [] },
    { opcode: 'roll', group: 'sensors', type: 'reporter', args: [] },
    { opcode: 'compass', group: 'sensors', type: 'reporter', args: [] },
    { opcode: 'magforce', group: 'sensors', type: 'reporter', args: ['AXIS'] },

    // ── Sensors: environment ────────────────────────────────────
    { opcode: 'light', group: 'sensors', type: 'reporter', args: [] },
    { opcode: 'temp', group: 'sensors', type: 'reporter', args: [] },
    { opcode: 'sound', group: 'sensors', type: 'reporter', args: [] },

    // ── Pins / GPIO ─────────────────────────────────────────────
    { opcode: 'digitalwrite', group: 'pins', type: 'command', args: ['PIN', 'LEVEL'] },
    { opcode: 'digitalread', group: 'pins', type: 'reporter', args: ['PIN'] },
    { opcode: 'ispinhigh', group: 'pins', type: 'boolean', args: ['PIN'] },
    { opcode: 'analogread', group: 'pins', type: 'reporter', args: ['PIN'] },
    { opcode: 'analogwrite', group: 'pins', type: 'command', args: ['PIN', 'PCT'] },
    { opcode: 'setpull', group: 'pins', type: 'command', args: ['PIN', 'PULL'] },
    { opcode: 'whentouch', group: 'pins', type: 'hat', args: ['PIN'] },
    { opcode: 'istouch', group: 'pins', type: 'boolean', args: ['PIN'] },

    // ── Actuators ───────────────────────────────────────────────
    { opcode: 'playtone', group: 'actuators', type: 'command', args: ['FREQ', 'MS'] },
    { opcode: 'playnote', group: 'actuators', type: 'command', args: ['NOTE'] },
    { opcode: 'stoptone', group: 'actuators', type: 'command', args: [] },
    { opcode: 'servo', group: 'actuators', type: 'command', args: ['PIN', 'DEG'] },
    { opcode: 'servocont', group: 'actuators', type: 'command', args: ['PIN', 'SPD'] },

    // ── Radio ───────────────────────────────────────────────────
    { opcode: 'radioon', group: 'radio', type: 'command', args: ['G', 'P'] },
    { opcode: 'radiosendnum', group: 'radio', type: 'command', args: ['N'] },
    { opcode: 'radiosendstr', group: 'radio', type: 'command', args: ['S'] },
    { opcode: 'radiosendkv', group: 'radio', type: 'command', args: ['KEY', 'VALUE'] },
    { opcode: 'whenradionum', group: 'radio', type: 'hat', args: [] },
    { opcode: 'radiolastnum', group: 'radio', type: 'reporter', args: [] },
    { opcode: 'whenradiostr', group: 'radio', type: 'hat', args: [] },
    { opcode: 'radiolaststr', group: 'radio', type: 'reporter', args: [] },

    // ── Connection ──────────────────────────────────────────────
    { opcode: 'whenconn', group: 'connection', type: 'hat', args: ['CONNSTATE'] },
];

// Note→frequency table (Hz, equal temperament A4=440)
export const NOTE_FREQ = {
    C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494,
    C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, B5: 988,
};

// MicroPython lowering table — maps each opcode to its Backend-S output.
// Used by generateMicroPython() to emit the correct MicroPython for each block.
// Format: opcode → function(args) → MicroPython string
//
// Groups with lowering implemented in sb3Creator.js: display (D1–D6)
// Groups pending (bw-audit): pins (P1–P7), actuators (A1–A4), radio (R1–R5),
//   events (B1–B4), sensors (M1–M11, E1–E3)
export const LOWERING = {
    // ── Display (implemented in sb3Creator.js) ──────────────────
    showmatrix: (MATRIX) => `display.show(Image('${MATRIX}'))`,
    showtext: (TEXT) => `display.scroll('${TEXT}')`,
    scrolltext: (TEXT, MS) => `display.scroll('${TEXT}', delay=${MS})`,
    cleardisplay: () => 'display.clear()',
    plot: (X, Y, STATE) => `display.set_pixel(${X}, ${Y}, ${STATE === 'on' ? 9 : 0})`,

    // ── Events ──────────────────────────────────────────────────
    isbutton: (BTN) => `button_${BTN.toLowerCase()}.is_pressed()`,
    isgesture: (GESTURE) => `accelerometer.is_gesture('${GESTURE}')`,
    istouch: (PIN) => `pin${PIN}.is_touched()`,

    // ── Sensors ─────────────────────────────────────────────────
    accel: (AXIS) => AXIS === 'strength'
        ? 'math.sqrt(accelerometer.get_x()**2 + accelerometer.get_y()**2 + accelerometer.get_z()**2)'
        : `accelerometer.get_${AXIS}()`,
    pitch: () => '_pitch()',
    roll: () => '_roll()',
    compass: () => 'compass.heading()',
    magforce: (AXIS) => AXIS === 'absolute'
        ? 'math.sqrt(compass.get_x()**2 + compass.get_y()**2 + compass.get_z()**2)'
        : `compass.get_${AXIS}()`,
    light: () => 'display.read_light_level()',
    temp: () => 'temperature()',
    sound: () => 'microphone.sound_level()',

    // ── Pins / GPIO ─────────────────────────────────────────────
    digitalwrite: (PIN, LEVEL) => `pin${PIN}.write_digital(${LEVEL})`,
    digitalread: (PIN) => `pin${PIN}.read_digital()`,
    ispinhigh: (PIN) => `pin${PIN}.read_digital() == 1`,
    analogread: (PIN) => `pin${PIN}.read_analog()`,
    analogwrite: (PIN, PCT) => `pin${PIN}.write_analog(${Math.round(PCT * 1023 / 100)})`,
    setpull: (PIN, PULL) => {
        const mode = { none: 'NO_PULL', up: 'PULL_UP', down: 'PULL_DOWN' }[PULL] || 'NO_PULL';
        return `pin${PIN}.set_pull(pin${PIN}.${mode})`;
    },

    // ── Actuators ───────────────────────────────────────────────
    playtone: (FREQ, MS) => MS > 0
        ? `music.pitch(${FREQ}, ${MS}, pin=pin0)`
        : `music.pitch(${FREQ}, pin=pin0)`,
    playnote: (NOTE) => `music.pitch(${NOTE_FREQ[NOTE] || 440}, 500, pin=pin0)`,
    stoptone: () => 'music.stop()',
    servo: (PIN, DEG) => `pin${PIN}.write_analog(${Math.round(25.6 + DEG * 102.4 / 180)})`,
    servocont: (PIN, SPD) => `pin${PIN}.write_analog(${Math.round(76.8 + SPD * 51.2 / 100)})`,

    // ── Radio ───────────────────────────────────────────────────
    radioon: (G, P) => `import radio; radio.config(group=${G}, power=${P}); radio.on()`,
    radiosendnum: (N) => `radio.send(str(${N}))`,
    radiosendstr: (S) => `radio.send('${S}')`,
    radiosendkv: (KEY, VALUE) => `radio.send('${KEY}=' + str(${VALUE}))`,
    radiolastnum: () => '_radio_last_num',
    radiolaststr: () => '_radio_last_str',
};

// Convenience: get all opcodes in a group
export function groupOpcodes(group) {
    return BLOCK_TABLE.filter(b => b.group === group).map(b => b.opcode);
}

// Convenience: which groups have full lowering coverage?
export function loweringCoverage() {
    const groups = {};
    for (const block of BLOCK_TABLE) {
        if (!groups[block.group]) groups[block.group] = { total: 0, covered: 0, missing: [] };
        groups[block.group].total++;
        if (LOWERING[block.opcode]) groups[block.group].covered++;
        else groups[block.group].missing.push(block.opcode);
    }
    return groups;
}
