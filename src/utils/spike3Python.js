// LEGO SPIKE App 3 Python <-> the SPIKE dialect.
//
// The fifth reader, and the first whose programs were written for a hub that is
// not ours. SPIKE App 3 ("SPIKE 3") Python is MicroPython on the hub with LEGO's
// modules — `hub` (light_matrix, sound, port, motion_sensor, button), `motor`,
// `motor_pair`, `color_sensor`, `distance_sensor`, `force_sensor`, `color` and
// `runloop` — and async/await for anything that takes time. This file reads such
// a program into the pseudocode's SPIKE vocabulary (`DEVICE SPIKE`, `start motor
// A forward`, `spike distance B in mm`), which compiles to the spikeprime blocks;
// and it writes blocks back out as SPIKE 3 Python.
//
// WRITTEN FROM THE DOCUMENTED API, NOT FROM LEGO CODE. Every name, signature,
// unit and constant below is taken from LEGO's public help for the SPIKE App 3
// Python API (spike.legoeducation.com/prime/help/lls-help-python, read through
// the generated reference at jvolkening.github.io/lego-spike-python-v3-docs),
// the SPIKE Prime hub protocol docs (lego.github.io/spike-prime-docs) for the
// hub's own units, and PrimeLessons' SPIKE 3 gyro lesson for the yaw sign. No
// LEGO firmware or app code was read or copied.
//
// THE TWO RULES, as in the MakeCode reader:
// 1. Emit only lines the dialect's own decompiler produces, so the output
//    compiles instead of nearly compiling.
// 2. Nothing vanishes. A call with no block becomes a `# unsupported:` line AND
//    an entry in `unsupported`; a call that maps with a change of meaning (a
//    unit, a scale, a wait that SPIKE 3 would not do) is listed in `notes`.
//
// UNITS, the part a line-by-line reading gets wrong:
//   velocity   SPIKE 3: degrees/second. Blocks: percent. 10 deg/s = 1 % here —
//              the scale the virtual hub already uses for motor.run() (1000 deg/s
//              is its 100 %). A real hub scales by each motor type's rated
//              maximum (660/1110/1050 deg/s); that difference is a note.
//   yaw        SPIKE 3 tilt_angles(): decidegrees, and the OPPOSITE sign to the
//              app's yaw (clockwise is negative). Blocks: degrees, app sign.
//              So yaw_py = -10 * yaw_block. Pitch and roll: x10, sign kept (the
//              sources state the yaw inversion only).
//   distance   SPIKE 3: millimetres, -1 for no reading. `spike distance P in mm`.
//   force      SPIKE 3: decinewtons 0-100, which is the hub record's 0-100.
//   durations  SPIKE 3: milliseconds. Blocks: seconds.
//
// The exporter leaves evidence the importer reads back (`_bw_speed[port.A]`, the
// per-port speed the blocks keep; `_bw_move_speed`; `velocity=_bw_move_speed * 10`),
// in the manner of micropythonToPseudocode.js: that is what makes blocks ->
// Python -> blocks a fixed point rather than a drift.

import { Tokenizer, Parser, Translator } from './pythonToPseudocode.js';

/** Import lines that make a program SPIKE App 3 Python. */
const SPIKE3_IMPORT = /^\s*(?:import\s+(?:runloop|motor_pair|motor|color_sensor|distance_sensor|force_sensor)\b|from\s+hub\s+import\b)/m;

export function isSpike3Python (source) {
    return SPIKE3_IMPORT.test(String(source || ''));
}

const PORTS = 'ABCDEF';
/** color module constants (API: color.BLACK = 0 … color.WHITE = 10, UNKNOWN = -1) -> the name getColor reports. */
const COLOR_NAMES = { BLACK: 'black', MAGENTA: 'magenta', PURPLE: 'purple', BLUE: 'blue', AZURE: 'azure',
    TURQUOISE: 'turquoise', GREEN: 'green', YELLOW: 'yellow', ORANGE: 'orange', RED: 'red', WHITE: 'white',
    UNKNOWN: 'none' };
const COLOR_BY_NAME = Object.fromEntries(Object.entries(COLOR_NAMES).map(([k, v]) => [v, k]));
/** motion_sensor face constants (TOP = 0 … LEFT = 5), as the hub's face-up names. */
const FACE_NAMES = { TOP: 'top', FRONT: 'front', RIGHT: 'right', BOTTOM: 'bottom', BACK: 'back', LEFT: 'left' };
const FACE_BY_NAME = Object.fromEntries(Object.entries(FACE_NAMES).map(([k, v]) => [v, k]));
/** motor stop constants (COAST = 0, BRAKE = 1, HOLD = 2, …) with a block equivalent. */
const STOP_ACTIONS = { COAST: 'coast', BRAKE: 'brake', HOLD: 'hold' };
/** hub.light_matrix built-in images, IMAGE_HEART = 1 … IMAGE_SNAKE = 67, in API order. */
export const LIGHT_MATRIX_IMAGES = Object.freeze([
    'HEART', 'HEART_SMALL', 'HAPPY', 'SMILE', 'SAD', 'CONFUSED', 'ANGRY', 'ASLEEP', 'SURPRISED', 'SILLY',
    'FABULOUS', 'MEH', 'YES', 'NO', 'CLOCK12', 'CLOCK1', 'CLOCK2', 'CLOCK3', 'CLOCK4', 'CLOCK5', 'CLOCK6',
    'CLOCK7', 'CLOCK8', 'CLOCK9', 'CLOCK10', 'CLOCK11', 'ARROW_N', 'ARROW_NE', 'ARROW_E', 'ARROW_SE',
    'ARROW_S', 'ARROW_SW', 'ARROW_W', 'ARROW_NW', 'GO_RIGHT', 'GO_LEFT', 'GO_UP', 'GO_DOWN', 'TRIANGLE',
    'TRIANGLE_LEFT', 'CHESSBOARD', 'DIAMOND', 'DIAMOND_SMALL', 'SQUARE', 'SQUARE_SMALL', 'RABBIT', 'COW',
    'MUSIC_CROTCHET', 'MUSIC_QUAVER', 'MUSIC_QUAVERS', 'PITCHFORK', 'XMAS', 'PACMAN', 'TARGET', 'TSHIRT',
    'ROLLERSKATE', 'DUCK', 'HOUSE', 'TORTOISE', 'BUTTERFLY', 'STICKFIGURE', 'GHOST', 'SWORD', 'GIRAFFE',
    'SKULL', 'UMBRELLA', 'SNAKE'
]);
/** Degrees per second per block percent (see UNITS above). */
export const VELOCITY_PER_PERCENT = 10;
const VELOCITY_NOTE = `velocities in degrees/second become block speeds at ${VELOCITY_PER_PERCENT} deg/s per percent; a real hub scales by each motor's rated maximum`;
/** The extension's own wheel travel per rotation (legospike moveForward: cm / 17.6, in / 6.93). */
const CM_PER_ROTATION = 17.6;
const IN_PER_ROTATION = 6.93;

/**
 * The documented SPIKE App 3 Python API, function by function, and what this
 * reader does with each: `mapped` (to blocks, same meaning), `approximate`
 * (to blocks, with a change of meaning listed in `notes`), `unsupported` (named
 * in `unsupported`, a `# unsupported:` line in the output). The list is every
 * function in LEGO's module reference; test/spike3-python.test.mjs holds the
 * reader to it, sample by sample. `sample` is a statement inside `async def`.
 */
export const SPIKE3_API = Object.freeze({
    'motor.run': ['approximate', 'motor.run(port.A, 500)'],
    'motor.stop': ['mapped', 'motor.stop(port.A)'],
    'motor.run_for_degrees': ['approximate', 'await motor.run_for_degrees(port.A, 360, 500)'],
    'motor.run_for_time': ['approximate', 'await motor.run_for_time(port.A, 1000, 500)'],
    'motor.run_to_absolute_position': ['approximate', 'await motor.run_to_absolute_position(port.A, 90, 500)'],
    'motor.run_to_relative_position': ['approximate', 'await motor.run_to_relative_position(port.A, 90, 500)'],
    'motor.reset_relative_position': ['mapped', 'motor.reset_relative_position(port.A, 0)'],
    'motor.relative_position': ['mapped', 'v = motor.relative_position(port.A)'],
    'motor.absolute_position': ['mapped', 'v = motor.absolute_position(port.A)'],
    'motor.velocity': ['approximate', 'v = motor.velocity(port.A)'],
    'motor.set_duty_cycle': ['approximate', 'motor.set_duty_cycle(port.A, 5000)'],
    'motor.get_duty_cycle': ['unsupported', 'v = motor.get_duty_cycle(port.A)'],
    'motor.status': ['unsupported', 'v = motor.status(port.A)'],
    'motor.info': ['unsupported', 'v = motor.info(port.A)'],
    'motor_pair.pair': ['mapped', 'motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)'],
    'motor_pair.unpair': ['approximate', 'motor_pair.unpair(motor_pair.PAIR_1)'],
    'motor_pair.stop': ['mapped', 'motor_pair.stop(motor_pair.PAIR_1)'],
    'motor_pair.move': ['approximate', 'motor_pair.move(motor_pair.PAIR_1, 0, velocity=500)'],
    'motor_pair.move_tank': ['approximate', 'motor_pair.move_tank(motor_pair.PAIR_1, 300, -300)'],
    'motor_pair.move_for_degrees': ['approximate', 'await motor_pair.move_for_degrees(motor_pair.PAIR_1, 360, 30, velocity=500)'],
    'motor_pair.move_for_time': ['approximate', 'await motor_pair.move_for_time(motor_pair.PAIR_1, 1000, 0, velocity=500)'],
    'motor_pair.move_tank_for_degrees': ['approximate', 'await motor_pair.move_tank_for_degrees(motor_pair.PAIR_1, 360, 300, 200)'],
    'motor_pair.move_tank_for_time': ['approximate', 'await motor_pair.move_tank_for_time(motor_pair.PAIR_1, 300, 200, 1000)'],
    'color_sensor.color': ['approximate', 'v = color_sensor.color(port.C)'],
    'color_sensor.reflection': ['approximate', 'v = color_sensor.reflection(port.C)'],
    'color_sensor.rgbi': ['unsupported', 'v = color_sensor.rgbi(port.C)'],
    'distance_sensor.distance': ['approximate', 'v = distance_sensor.distance(port.D)'],
    'distance_sensor.clear': ['unsupported', 'distance_sensor.clear(port.D)'],
    'distance_sensor.get_pixel': ['unsupported', 'v = distance_sensor.get_pixel(port.D, 0, 0)'],
    'distance_sensor.set_pixel': ['unsupported', 'distance_sensor.set_pixel(port.D, 0, 0, 100)'],
    'distance_sensor.show': ['unsupported', 'distance_sensor.show(port.D, [100, 100, 100, 100])'],
    'force_sensor.force': ['mapped', 'v = force_sensor.force(port.E)'],
    'force_sensor.pressed': ['mapped', 'v = force_sensor.pressed(port.E)'],
    'force_sensor.raw': ['unsupported', 'v = force_sensor.raw(port.E)'],
    'hub.button.pressed': ['approximate', 'v = button.pressed(button.LEFT)'],
    'hub.light.color': ['unsupported', 'light.color(light.POWER, color.RED)'],
    'hub.light_matrix.write': ['mapped', 'await light_matrix.write("Hi")'],
    'hub.light_matrix.clear': ['mapped', 'light_matrix.clear()'],
    'hub.light_matrix.show_image': ['approximate', 'light_matrix.show_image(light_matrix.IMAGE_HAPPY)'],
    'hub.light_matrix.set_pixel': ['mapped', 'light_matrix.set_pixel(2, 2, 100)'],
    'hub.light_matrix.get_pixel': ['unsupported', 'v = light_matrix.get_pixel(2, 2)'],
    'hub.light_matrix.show': ['unsupported', 'light_matrix.show([100] * 25)'],
    'hub.light_matrix.set_orientation': ['unsupported', 'light_matrix.set_orientation(1)'],
    'hub.light_matrix.get_orientation': ['unsupported', 'v = light_matrix.get_orientation()'],
    'hub.sound.beep': ['mapped', 'await sound.beep(440, 500)'],
    'hub.sound.stop': ['mapped', 'sound.stop()'],
    'hub.sound.volume': ['unsupported', 'sound.volume(50)'],
    'hub.motion_sensor.tilt_angles': ['mapped', 'v = motion_sensor.tilt_angles()[0]'],
    'hub.motion_sensor.reset_yaw': ['mapped', 'motion_sensor.reset_yaw(0)'],
    'hub.motion_sensor.acceleration': ['mapped', 'v = motion_sensor.acceleration()[2]'],
    'hub.motion_sensor.up_face': ['approximate', 'v = motion_sensor.up_face()'],
    'hub.motion_sensor.angular_velocity': ['unsupported', 'v = motion_sensor.angular_velocity()[0]'],
    'hub.motion_sensor.gesture': ['unsupported', 'v = motion_sensor.gesture()'],
    'hub.motion_sensor.stable': ['unsupported', 'v = motion_sensor.stable()'],
    'hub.motion_sensor.quaternion': ['unsupported', 'v = motion_sensor.quaternion()'],
    'hub.motion_sensor.get_yaw_face': ['unsupported', 'v = motion_sensor.get_yaw_face()'],
    'hub.motion_sensor.set_yaw_face': ['unsupported', 'motion_sensor.set_yaw_face(motion_sensor.TOP)'],
    'hub.motion_sensor.tap_count': ['unsupported', 'v = motion_sensor.tap_count()'],
    'hub.motion_sensor.reset_tap_count': ['unsupported', 'motion_sensor.reset_tap_count()'],
    'runloop.sleep_ms': ['mapped', 'await runloop.sleep_ms(250)'],
    'runloop.until': ['mapped', 'await runloop.until(lambda: force_sensor.pressed(port.E))'],
    'runloop.run': ['mapped', null],
    'hub.temperature': ['unsupported', 'v = hub.temperature()'],
    'hub.battery_voltage': ['unsupported', 'v = hub.battery_voltage()'],
    'hub.battery_current': ['unsupported', 'v = hub.battery_current()'],
    'hub.battery_temperature': ['unsupported', 'v = hub.battery_temperature()'],
    'hub.usb_charge_current': ['unsupported', 'v = hub.usb_charge_current()'],
    'hub.device_uuid': ['unsupported', 'v = hub.device_uuid()'],
    'hub.hardware_id': ['unsupported', 'v = hub.hardware_id()'],
    'hub.power_off': ['unsupported', 'hub.power_off()'],
    'hub.reset': ['unsupported', 'hub.reset()'],
    'hub.soft_reset': ['unsupported', 'hub.soft_reset()'],
    'hub.bootloader': ['unsupported', 'hub.bootloader()']
});

/** Names the pseudocode takes for Scratch blocks when written (`set x to` is motion). */
const NOT_A_VARIABLE = new Set(['x', 'y', 'size', 'volume', 'tempo']);

const isNum = (n) => n && n.type === 'Num';
const numOf = (n) => Number(n.value);
const isNegNum = (n) => n && n.type === 'Unary' && n.op === '-' && isNum(n.operand);
/** A literal number (with its sign) or null. */
const literalNumber = (n) => {
    if (isNum(n)) return numOf(n);
    if (isNegNum(n)) return -numOf(n.operand);
    return null;
};
/** Trim a computed number to what a person would type. */
const fmt = (v) => String(Math.round(v * 10000) / 10000);
const SIMPLE_TOKEN = /^(-?\d+(\.\d+)?|[A-Za-z_][\w]*)$/;

/** Does this statement break out of the loop it is in (not out of a nested one)? */
function mayBreak (node) {
    let found = false;
    const walk = (n) => {
        if (found || !n || typeof n !== 'object') return;
        if (Array.isArray(n)) { n.forEach(walk); return; }
        if (n.type === 'Break') { found = true; return; }
        if (n.type === 'While' || n.type === 'For' || n.type === 'Def') return;
        for (const v of Object.values(n)) if (v && typeof v === 'object') walk(v);
    };
    walk(node);
    return found;
}

let Spike3TranslatorClass = null;

/**
 * The translator class, built on first use: pythonToPseudocode.js imports this
 * module to route SPIKE 3 programs here, so its Translator is not initialised
 * yet while this module is being evaluated.
 */
function translatorClass () {
    if (Spike3TranslatorClass) return Spike3TranslatorClass;
    Spike3TranslatorClass = class Spike3Translator extends Translator {
        constructor () {
            super();
            this.unsupported = [];
            this.notes = [];
            this.modules = new Map();   // local name -> canonical dotted module ('motor', 'hub.light_matrix', 'port')
            this.constants = new Map(); // module-level name -> AST node it stands for (port.A, PAIR_1, …)
            this.pairs = new Map();     // motor_pair slot -> {left, right}
            this.pairSlotsUsed = new Set();
            this.pre = [];              // hoisted lines for the statement being translated
            this.temps = 0;
            this.predicates = new Map(); // def name -> returned expression, for runloop.until(fn)
            this.userFunctions = new Set();
            this.line = null;
            this.renamed = new Map();
            this.valueRefusals = [];
        }

        pad (n) { return '  '.repeat(n); }

        note (text) { if (!this.notes.includes(text)) this.notes.push(text); }

        refuse (what) {
            this.unsupported.push(what);
            this.warn(`unsupported: ${what}`);
            return `# unsupported: ${what}${this.line ? ` (line ${this.line})` : ''}`;
        }

        // ── names ─────────────────────────────────────────────────────────

        /** A variable's pseudocode name: the grammar owns x, y, size, volume, tempo. */
        vname (id) {
            if (!NOT_A_VARIABLE.has(String(id).toLowerCase())) return id;
            if (!this.renamed.has(id)) this.renamed.set(id, `${id}_`);
            return this.renamed.get(id);
        }

        /** Canonical dotted path of a Name/Attribute chain, through import aliases. */
        qual (node) {
            const parts = [];
            let cur = node;
            while (cur && cur.type === 'Attribute') { parts.unshift(cur.attr); cur = cur.value; }
            if (!cur || cur.type !== 'Name') return null;
            const head = this.modules.get(cur.id);
            if (head) parts.unshift(head);
            else if (this.constants.has(cur.id) && !parts.length) return this.qual(this.constants.get(cur.id));
            else parts.unshift(cur.id);
            let path = parts.join('.');
            // hub.light_matrix.write and light_matrix.write are one function; the
            // hub module's own functions (hub.temperature) keep their prefix.
            if (path.startsWith('hub.') && path.split('.').length > 2) path = path.slice(4);
            return path;
        }

        callPath (call) { return call && call.type === 'Call' ? this.qual(call.func) : null; }

        /** `port.A` (or a module constant naming it) -> 'A'. */
        port (node) {
            const q = node && this.qual(node);
            const m = q && /^port\.([A-F])$/.exec(q);
            if (m) return m[1];
            const n = literalNumber(node);
            if (n !== null && Number.isInteger(n) && n >= 0 && n < 6) return PORTS[n];
            return null;
        }

        /** motor_pair.PAIR_n (or 0-2) -> n-1, or null. */
        pairSlot (node) {
            const q = node && this.qual(node);
            const m = q && /^motor_pair\.PAIR_([123])$/.exec(q);
            if (m) return Number(m[1]) - 1;
            const n = literalNumber(node);
            return n !== null && [0, 1, 2].includes(n) ? n : null;
        }

        /** Positional argument i, or the keyword of that name. */
        arg (call, i, name) {
            if (call.args[i] !== undefined) return call.args[i];
            const k = (call.keywords || []).find((kw) => kw.name === name);
            return k ? k.value : undefined;
        }

        kw (call, name) { const k = (call.keywords || []).find((kw) => kw.name === name); return k ? k.value : undefined; }

        /** Keywords a mapping does not carry: each one named, never ignored in silence. */
        extraKeywords (call, fn, handled) {
            for (const k of call.keywords || []) {
                if (handled.includes(k.name)) continue;
                if (['acceleration', 'deceleration'].includes(k.name)) {
                    this.note(`${fn}: ${k.name}= is not modelled; the blocks use the motor's own ramp`);
                } else this.note(`${fn}: keyword ${k.name}= has no block and is not carried`);
            }
        }

        // ── values ────────────────────────────────────────────────────────

        /** A value as one token: a literal or a name, else hoisted into a temp. */
        tok (text) {
            const t = this.stripOuterParens(String(text));
            if (SIMPLE_TOKEN.test(t)) return t;
            this.temps += 1;
            const name = `spike_tmp${this.temps}`;
            this.pre.push(`set ${name} to ${t}`);
            return name;
        }

        /** value / k as pseudocode, folding literals and the exporter's `X * k`. */
        scaledDown (node, k) {
            if (k === VELOCITY_PER_PERCENT) this.note(VELOCITY_NOTE);
            const n = literalNumber(node);
            if (n !== null) return fmt(n / k);
            if (node.type === 'BinOp' && node.op === '*' && literalNumber(node.right) === k) return this.expr(node.left);
            return `(${this.expr(node)} / ${k})`;
        }

        /** Milliseconds node -> seconds pseudocode. */
        seconds (node) {
            const inner = this.unwrap(node);
            const n = literalNumber(inner);
            if (n !== null) return fmt(n / 1000);
            if (inner.type === 'BinOp' && inner.op === '*' && literalNumber(inner.right) === 1000) return this.expr(inner.left);
            return `(${this.expr(inner)} / 1000)`;
        }

        /** Is this the exporter's `<marker> * k` velocity? Returns the sign, or 0. */
        markerVelocity (node, marker) {
            if (!node || node.type !== 'BinOp' || node.op !== '*') return 0;
            const k = literalNumber(node.right);
            if (Math.abs(k) !== VELOCITY_PER_PERCENT) return 0;
            const l = node.left;
            const ok = marker === '_bw_move_speed'
                ? l.type === 'Name' && l.id === '_bw_move_speed'
                : l.type === 'Subscript' && l.value.type === 'Name' && l.value.id === '_bw_speed';
            return ok ? Math.sign(k) : 0;
        }

        expr (node) {
            if (!node) return '';
            switch (node.type) {
                case 'Name': {
                    if (this.constants.has(node.id)) return this.expr(this.constants.get(node.id));
                    return this.vname(node.id);
                }
                case 'Attribute': return this.constantValue(node);
                case 'Call': {
                    const v = this.spikeReporter(node);
                    if (v !== null) return v;
                    const path = this.callPath(node);
                    if (path && this.isSpikeModulePath(path)) return `(${this.valueRefused(`${path}()`)})`;
                    if (node.func.type === 'Name' && this.userFunctions.has(node.func.id)) {
                        if (this.predicates.has(node.func.id)) return this.expr(this.predicates.get(node.func.id));
                        return this.valueRefused(`the value of ${node.func.id}() (a custom block has no return value)`);
                    }
                    // Only the calls the base reader has a block for; anything else is
                    // named here rather than read as "" by the base reader's fallback.
                    const known = node.func.type === 'Name'
                        ? ['min', 'max', 'abs', 'round', 'len', 'str', 'int', 'float'].includes(node.func.id)
                        : /^(random\.randint|math\.(floor|ceil|sqrt|sin|cos|tan|log|log10|exp|factorial|min|max|pow))$/.test(path || '');
                    if (!known) return this.valueRefused(`${path || (node.func.type === 'Name' ? node.func.id : 'a call')}() as a value`);
                    return super.expr(node);
                }
                case 'Subscript': {
                    const v = this.tupleItem(node);
                    if (v !== null) return v;
                    return super.expr(node);
                }
                case 'Compare': return this.compare(node);
                case 'Await': {
                    const path = this.callPath(node.value);
                    if (path === 'runloop.sleep_ms' || path === 'runloop.until') return this.valueRefused(`await ${path}() as a value`);
                    return this.expr(node.value);
                }
                case 'Lambda': return this.valueRefused('a lambda outside runloop.until');
                case 'Tuple': return this.valueRefused('a tuple value');
                default: return super.expr(node);
            }
        }

        /** An expression that has no value form: reported, and 0 stands in. */
        valueRefused (what) {
            this.unsupported.push(what);
            this.warn(`unsupported: ${what}`);
            // Shown in the program too, above the statement that read it: a 0
            // standing in for a value must not look like a value that was read.
            this.valueRefusals.push(what);
            return '0';
        }

        isSpikeModulePath (path) {
            return /^(motor|motor_pair|color_sensor|distance_sensor|force_sensor|light_matrix|sound|motion_sensor|button|light|runloop|port|color|device|color_matrix|app|hub)\./.test(path);
        }

        /** A module constant read as a value. */
        constantValue (node) {
            const q = this.qual(node) || '';
            let m;
            if ((m = /^color\.([A-Z]+)$/.exec(q)) && COLOR_NAMES[m[1]]) {
                this.note('colours are names in the blocks ("red"), not the numbers color.RED stands for');
                return `"${COLOR_NAMES[m[1]]}"`;
            }
            if ((m = /^motion_sensor\.([A-Z]+)$/.exec(q)) && FACE_NAMES[m[1]]) return `"${FACE_NAMES[m[1]]}"`;
            if ((m = /^light_matrix\.IMAGE_([A-Z0-9_]+)$/.exec(q))) {
                const i = LIGHT_MATRIX_IMAGES.indexOf(m[1]);
                if (i >= 0) return String(i + 1);
            }
            if ((m = /^port\.([A-F])$/.exec(q))) return String(PORTS.indexOf(m[1]));
            if ((m = /^motor_pair\.PAIR_([123])$/.exec(q))) return String(Number(m[1]) - 1);
            const MOTOR = { READY: 0, RUNNING: 1, STALLED: 2, CANCELED: 3, CANCELLED: 3, ERROR: 4, DISCONNECTED: 5,
                COAST: 0, BRAKE: 1, HOLD: 2, CONTINUE: 3, SMART_COAST: 4, SMART_BRAKE: 5,
                CLOCKWISE: 0, COUNTERCLOCKWISE: 1, SHORTEST_PATH: 2, LONGEST_PATH: 3 };
            if ((m = /^motor\.([A-Z_]+)$/.exec(q)) && MOTOR[m[1]] !== undefined) return String(MOTOR[m[1]]);
            if ((m = /^button\.(LEFT|RIGHT)$/.exec(q))) return m[1] === 'LEFT' ? '0' : '2';
            return super.expr(node);
        }

        /** A SPIKE reporter call as pseudocode, or null when it is not one. */
        spikeReporter (call) {
            const path = this.callPath(call);
            if (!path) return null;
            const p = () => this.port(call.args[0]);
            const needPort = (fn, text) => {
                const port = p();
                return port ? text(port) : this.valueRefused(`${fn} on a port that is not a constant port.X`);
            };
            switch (path) {
                case 'color_sensor.color':
                    this.note('colours are names in the blocks ("red"), not the numbers color.RED stands for');
                    return needPort(path, (x) => `(spike color ${x})`);
                case 'color_sensor.reflection':
                    this.note('color_sensor.reflection(): the spikeprime extension reports reflection on firmware 2.x only; on 3.x the block is blank');
                    return needPort(path, (x) => `(spike reflection ${x})`);
                case 'distance_sensor.distance':
                    this.note('distance_sensor.distance(): no reading reads as 0 in the blocks, where SPIKE 3 returns -1');
                    return needPort(path, (x) => `(spike distance ${x} in mm)`);
                case 'force_sensor.force': return needPort(path, (x) => `(spike force ${x})`);
                case 'force_sensor.pressed': return needPort(path, (x) => `(spike force sensor ${x} pressed)`);
                case 'motor.relative_position': return needPort(path, (x) => `(spike motor relative position ${x})`);
                case 'motor.absolute_position':
                    // getPosition is 0..359; the API's absolute position is -179..180.
                    return needPort(path, (x) => `((((spike motor position ${x}) + 179) mod 360) - 179)`);
                case 'motor.velocity':
                    this.note('motor.velocity(): the block reports the hub\'s speed scaled to deg/s, an approximation');
                    return needPort(path, (x) => `(spike motor speed ${x})`);
                case 'motion_sensor.up_face':
                    this.note('motion_sensor.up_face() is a face name in the blocks ("top"), not the number motion_sensor.TOP stands for');
                    return '(spike face up)';
                case 'button.pressed': {
                    const b = this.qual(call.args[0] || {}) || '';
                    const which = /\.LEFT$/.test(b) ? 'left' : /\.RIGHT$/.test(b) ? 'right' : null;
                    if (!which) return this.valueRefused('button.pressed() on a button other than button.LEFT/RIGHT');
                    this.note('button.pressed() is true/false in the blocks, not the milliseconds held');
                    return `(spike button ${which} pressed)`;
                }
                case 'motion_sensor.tilt_angles':
                case 'motion_sensor.acceleration':
                case 'motion_sensor.angular_velocity':
                    return this.valueRefused(`${path}() as a whole tuple (index it, or unpack it into names)`);
                default: return null;
            }
        }

        /** tilt_angles()[i] / acceleration()[i], the exporter's `/ ±10`, and getPosition's `% 360`. */
        tupleItem (node) {
            const path = this.callPath(node.value);
            const i = literalNumber(node.index);
            if (!path || i === null) return null;
            return this.axisValue(path, i);
        }

        axisValue (path, i) {
            if (path === 'motion_sensor.tilt_angles') {
                if (i === 0) return '((0 - (spike angle yaw)) * 10)';
                if (i === 1 || i === 2) {
                    this.note('pitch and roll are read as block degrees x10; their sign is not documented as inverted, and is kept');
                    return `((spike angle ${i === 1 ? 'pitch' : 'roll'}) * 10)`;
                }
            }
            if (path === 'motion_sensor.acceleration' && i >= 0 && i <= 2) return `(spike acceleration ${'xyz'[i]})`;
            if (path === 'motion_sensor.angular_velocity') return this.valueRefused('motion_sensor.angular_velocity()');
            return null;
        }

        binop (node) {
            // The exporter's forms, read back as the reporter they came from.
            const L = node.left, R = node.right;
            const lp = L && L.type === 'Subscript' ? this.callPath(L.value) : null;
            if (node.op === '/' && lp === 'motion_sensor.tilt_angles' && literalNumber(L.index) === 0 && literalNumber(R) === -10) return '(spike angle yaw)';
            if (node.op === '/' && lp === 'motion_sensor.tilt_angles' && [1, 2].includes(literalNumber(L.index)) && literalNumber(R) === 10) {
                return `(spike angle ${literalNumber(L.index) === 1 ? 'pitch' : 'roll'})`;
            }
            const cp = this.callPath(L);
            if (cp === 'distance_sensor.distance') {
                const port = this.port(L.args[0]);
                const unit = { 10: 'cm', 25.4: 'inches', 20: 'percent' }[literalNumber(R)];
                if (port && node.op === '/' && unit) {
                    this.note('distance_sensor.distance(): no reading reads as 0 in the blocks, where SPIKE 3 returns -1');
                    return unit === 'cm' ? `(spike distance ${port})` : `(spike distance ${port} in ${unit})`;
                }
            }
            if (cp === 'motor.absolute_position' && node.op === '%' && literalNumber(R) === 360) {
                const port = this.port(L.args[0]);
                if (port) return `(spike motor position ${port})`;
            }
            return super.binop(node);
        }

        compare (node) {
            // color_sensor.color(p) == color.RED  ->  the isColor boolean
            const sides = [[node.left, node.right], [node.right, node.left]];
            if (node.op === '==' || node.op === '!=') {
                for (const [a, b] of sides) {
                    if (this.callPath(a) === 'color_sensor.color') {
                        const q = this.qual(b) || '';
                        const m = /^color\.([A-Z]+)$/.exec(q);
                        const name = m ? COLOR_NAMES[m[1]] : (b.type === 'Str' && COLOR_BY_NAME[b.value] ? b.value : null);
                        const port = this.port(a.args[0]);
                        if (name && name !== 'none' && port) {
                            const test = `(spike color ${port} is ${name})`;
                            return node.op === '==' ? test : `(not ${test})`;
                        }
                    }
                }
            }
            return super.compare(node);
        }

        // ── statements ────────────────────────────────────────────────────

        stmt (s, indent) {
            const prevLine = this.line;
            if (s && s.line) this.line = s.line;
            const outer = this.valueRefusals;
            this.valueRefusals = [];
            let out = super.stmt(s, indent);
            if (this.valueRefusals.length) {
                const p = this.pad(indent);
                const where = this.line ? ` (line ${this.line})` : '';
                out = [...this.valueRefusals.map((w) => `${p}# unsupported: ${w}; 0 stands in for it${where}`), ...out];
            }
            this.valueRefusals = outer;
            this.line = prevLine;
            return out;
        }

        /** Emit hoisted lines before the statement's own. */
        withPre (indent, lines) {
            const p = this.pad(indent);
            const pre = this.pre.map((l) => p + l);
            this.pre = [];
            return [...pre, ...lines.map((l) => p + l)];
        }

        stmtCore (s, indent) {
            const p = this.pad(indent);
            if (s.type === 'Continue') return [p + this.refuse('continue')];
            if (s.type === 'Break') {
                if (this.breakFlag) return [p + `set ${this.breakFlag} to 1`];
                return [p + this.refuse('break outside a loop')];
            }
            if (s.type === 'Def') return [p + this.refuse(`def ${s.name} inside a function`)];
            if (s.type === 'Expr' && s.value && s.value.type === 'Str') return [];   // a docstring
            if (s.type === 'AugAssign' && s.target.type === 'Name' && s.op !== '+' && s.op !== '-') {
                const name = this.vname(s.target.id);
                const map = { '*': '*', '/': '/', '%': 'mod' };
                return this.withPre(indent, [`set ${name} to (${name} ${map[s.op]} ${this.expr(s.value)})`]);
            }
            const out = super.stmtCore(s, indent);
            if (this.pre.length) {
                const pre = this.pre.map((l) => p + l);
                this.pre = [];
                return [...pre, ...out];
            }
            return out;
        }

        whileStmt (s, indent) {
            const p = this.pad(indent);
            const forever = s.test.type === 'Const' && s.test.value === true;
            // while True: if C: break; ...   ->   REPEAT UNTIL C: ...
            if (forever && s.body.length && s.body[0].type === 'If' &&
                s.body[0].body.length === 1 && s.body[0].body[0].type === 'Break' && !(s.body[0].orelse || []).length &&
                !s.body.slice(1).some(mayBreak)) {
                const cond = this.stripOuterParens(this.expr(s.body[0].test));
                return [p + `REPEAT UNTIL ${cond}:`, ...this.block(s.body.slice(1), indent + 1)];
            }
            if (!s.body.some(mayBreak)) {
                const saved = this.breakFlag;
                this.breakFlag = null;
                const out = super.whileStmt(s, indent);
                this.breakFlag = saved;
                return out;
            }
            // Any other break: a flag the loop tests, set where the break was, and
            // everything after a statement that may break guarded by it — the loop
            // the break describes, in a grammar that has no break.
            this.temps += 1;
            const flag = `spike_done${this.temps}`;
            const saved = this.breakFlag;
            this.breakFlag = flag;
            const until = forever ? `${flag} = 1` : `(${flag} = 1) or (not ${this.expr(s.test)})`;
            const body = this.block(s.body, indent + 1);
            this.breakFlag = saved;
            return [p + `set ${flag} to 0`, p + `REPEAT UNTIL ${until}:`, ...body];
        }

        block (stmts, indent) {
            if (!this.breakFlag) return super.block(stmts, indent);
            const out = [];
            for (let i = 0; i < stmts.length; i++) {
                out.push(...this.stmt(stmts[i], indent));
                if (stmts[i].type === 'Break') break;               // the rest is unreachable
                if (mayBreak(stmts[i]) && i < stmts.length - 1) {
                    out.push(this.pad(indent) + `IF ${this.breakFlag} = 0 THEN:`);
                    out.push(...this.block(stmts.slice(i + 1), indent + 1));
                    break;
                }
            }
            return out;
        }

        forStmt (s, indent) {
            if (!this.breakFlag) return this.forStmtCore(s, indent);
            const saved = this.breakFlag;
            this.breakFlag = null;
            const out = this.forStmtCore(s, indent);
            this.breakFlag = saved;
            return out;
        }

        forStmtCore (s, indent) {
            const p = this.pad(indent);
            const it = s.iter;
            if (!(it.type === 'Call' && it.func.type === 'Name' && it.func.id === 'range')) {
                return [p + this.refuse('a for loop over something other than range()')];
            }
            const used = JSON.stringify(s.body).includes(`"id":"${s.target}"`);
            const [a, b, c] = it.args;
            const start = b ? a : null;
            const stop = b || a;
            const step = c ? literalNumber(c) : 1;
            if (step === null || step === 0) return [p + this.refuse('range() with a step that is not a literal number')];
            if (!used && !start && step === 1) return [p + `REPEAT ${this.expr(this.unwrap(stop))}:`, ...this.block(s.body, indent + 1)];
            const v = this.vname(s.target);
            const startText = start ? this.expr(start) : '0';
            const count = step === 1
                ? (start ? `(${this.expr(stop)} - ${startText})` : this.expr(stop))
                : `(ceiling of ((${this.expr(stop)} - ${startText}) / ${fmt(step)}))`;
            return [p + `set ${v} to ${startText}`, p + `REPEAT ${this.stripOuterParens(count)}:`,
                ...this.block(s.body, indent + 1), this.pad(indent + 1) + `change ${v} by ${fmt(step)}`];
        }

        assign (s, indent) {
            const p = this.pad(indent);
            const t = s.target;
            // tuple unpacking of a sensor tuple: yaw, pitch, roll = motion_sensor.tilt_angles()
            if (t.type === 'Tuple') {
                const path = this.callPath(s.value);
                if (path === 'motion_sensor.tilt_angles' || path === 'motion_sensor.acceleration') {
                    const out = [];
                    t.elts.forEach((e, i) => {
                        if (e.type === 'Name' && e.id !== '_') out.push(`set ${this.vname(e.id)} to ${this.axisValue(path, i)}`);
                    });
                    return this.withPre(indent, out);
                }
                return [p + this.refuse(path ? `${path}() unpacked into names` : 'tuple assignment')];
            }
            // the exporter's per-port speed and drive speed: back to their blocks
            if (t.type === 'Subscript' && t.value.type === 'Name' && t.value.id === '_bw_speed') {
                const port = this.port(t.index);
                if (port) return this.withPre(indent, [`set motor speed ${port} ${this.tok(this.expr(s.value))}`]);
            }
            if (t.type === 'Subscript' && t.value.type === 'Name' && t.value.id === '_bw_stop') {
                const port = this.port(t.index);
                const m = /^motor\.(COAST|BRAKE|HOLD)$/.exec(this.qual(s.value) || '');
                if (port && m) return [p + `set motor stop action ${port} ${STOP_ACTIONS[m[1]]}`];
            }
            if (t.type === 'Name' && t.id === '_bw_move_speed') return this.withPre(indent, [`set movement speed ${this.expr(s.value)}`]);
            if (t.type === 'Name') {
                const name = this.vname(t.id);
                return this.withPre(indent, [`set ${name} to ${this.stripOuterParens(this.expr(s.value))}`]);
            }
            return super.assign(s, indent);
        }

        exprStmt (eRaw, indent) {
            const p = this.pad(indent);
            const awaited = eRaw && eRaw.type === 'Await';
            const e = awaited ? eRaw.value : eRaw;
            if (!e || e.type !== 'Call') return [];
            const path = this.callPath(e);
            if (path && this.isSpikeModulePath(path)) {
                const lines = this.spikeCommand(path, e, awaited);
                return this.withPre(indent, lines);
            }
            if (e.func.type === 'Name' && this.userFunctions.has(e.func.id)) {
                const args = e.args.map((a) => this.tok(this.expr(a)));
                return this.withPre(indent, [`${e.func.id}${args.length ? ' ' + args.join(' ') : ''}`]);
            }
            if (e.func.type === 'Name' && e.func.id === 'print') {
                const parts = e.args.map((a) => this.expr(a));
                const text = parts.length ? parts.reduce((acc, x) => `(${acc} join ${x})`) : '""';
                return this.withPre(indent, [`say ${text}`]);
            }
            if (path === 'time.sleep_ms') return this.withPre(indent, [`wait ${this.seconds(e.args[0])} seconds`]);
            if (path === 'time.sleep') return this.withPre(indent, [`wait ${this.expr(e.args[0])} seconds`]);
            return [p + this.refuse(`${path || 'a call'}()`)];
        }

        /** Every SPIKE command call, as dialect lines (unindented; withPre indents). */
        spikeCommand (path, call, awaited) {
            const fn = path;
            const port = (i, name = 'port') => this.port(this.arg(call, i, name));
            const lit = (n) => literalNumber(n);
            const speedLine = (P, velocity) => {
                const sign = this.markerVelocity(velocity, '_bw_speed');
                if (sign) return { lines: [], sign };
                if (velocity === undefined) return { lines: [], sign: 1 };
                const v = lit(velocity);
                this.note(VELOCITY_NOTE);
                if (v !== null) return { lines: [`set motor speed ${P} ${fmt(Math.abs(v) / VELOCITY_PER_PERCENT)}`], sign: v < 0 ? -1 : 1 };
                return { lines: [`set motor speed ${P} ${this.tok(this.scaledDown(velocity, VELOCITY_PER_PERCENT))}`], sign: 1 };
            };
            const moveSpeed = (velocity) => {
                const sign = this.markerVelocity(velocity, '_bw_move_speed');
                if (sign) return { lines: [], sign };
                this.note(VELOCITY_NOTE);
                if (velocity === undefined) {
                    return { lines: [`set movement speed ${fmt(360 / VELOCITY_PER_PERCENT)}`], sign: 1 };
                }
                const v = lit(velocity);
                if (v !== null) return { lines: [`set movement speed ${fmt(Math.abs(v) / VELOCITY_PER_PERCENT)}`], sign: v < 0 ? -1 : 1 };
                return { lines: [`set movement speed ${this.scaledDown(velocity, VELOCITY_PER_PERCENT)}`], sign: 1 };
            };
            const notAwaited = () => {
                if (!awaited) this.note(`${fn}() without await: the block waits for it to finish, where SPIKE 3 carries on at once`);
            };
            const stopKw = (P) => {
                const st = this.kw(call, 'stop');
                if (!st) return [];
                const m = /^motor\.(COAST|BRAKE|HOLD)$/.exec(this.qual(st) || '');
                if (m && P) {
                    this.note(`${fn}: stop= becomes the port's stop action, which the blocks keep for later moves too`);
                    return [`set motor stop action ${P} ${STOP_ACTIONS[m[1]]}`];
                }
                this.note(`${fn}: stop=${this.qual(st) || '…'} has no block; the motor's stop action is used`);
                return [];
            };
            const needPort = (P) => P || null;
            const selectPair = (slotNode) => {
                const slot = this.pairSlot(slotNode);
                if (slot === null) return { ok: false, lines: [this.refuse(`${fn} on a pair that is not motor_pair.PAIR_n`)] };
                const pair = this.pairs.get(slot);
                if (!pair) return { ok: false, lines: [this.refuse(`${fn} on motor_pair.PAIR_${slot + 1}, which is never paired`)] };
                const lines = this.pairSlotsUsed.size > 1 ? [`set movement motors ${pair.left} ${pair.right}`] : [];
                return { ok: true, lines, pair };
            };
            /** Wait until either paired wheel has turned `degrees` from here. */
            const turnWheels = (pair, degreesText, startLines) => {
                this.temps += 1;
                const l0 = `spike_left${this.temps}`, r0 = `spike_right${this.temps}`;
                const dist = (P, v) => `(abs of ((spike motor relative position ${P}) - ${v}))`;
                const deg = /^\d+(\.\d+)?$/.test(degreesText) ? degreesText : this.tok(`abs of ${degreesText}`);
                return [
                    `set ${l0} to (spike motor relative position ${pair.left})`,
                    `set ${r0} to (spike motor relative position ${pair.right})`,
                    ...startLines,
                    `wait until (not (${dist(pair.left, l0)} < ${deg})) or (not (${dist(pair.right, r0)} < ${deg}))`,
                    'stop movement'
                ];
            };

            switch (fn) {
                // ── motor ────────────────────────────────────────────────
                case 'motor.run': {
                    const P = needPort(port(0));
                    if (!P) break;
                    this.extraKeywords(call, fn, []);
                    const velocity = this.arg(call, 1, 'velocity');
                    const { lines, sign } = speedLine(P, velocity);
                    return [...lines, `start motor ${P} ${sign < 0 ? 'backward' : 'forward'}`];
                }
                case 'motor.stop': {
                    const P = needPort(port(0));
                    if (!P) break;
                    this.extraKeywords(call, fn, ['stop']);
                    return [...stopKw(P), `stop motor ${P}`];
                }
                case 'motor.run_for_degrees':
                case 'motor.run_for_time': {
                    const P = needPort(port(0));
                    if (!P) break;
                    notAwaited();
                    this.extraKeywords(call, fn, ['stop', 'velocity', 'degrees', 'duration']);
                    const timed = fn === 'motor.run_for_time';
                    const amount = this.arg(call, 1, timed ? 'duration' : 'degrees');
                    const velocity = this.arg(call, 2, 'velocity');
                    const { lines, sign } = speedLine(P, velocity);
                    let value, unit, s = sign;
                    if (timed) { value = this.seconds(amount); unit = 'seconds'; } else {
                        unit = 'degrees';
                        const n = lit(amount);
                        if (n !== null) { value = fmt(Math.abs(n)); if (n < 0) s = -s; } else if (amount.type === 'BinOp' && amount.op === '*' && lit(amount.right) === 360) {
                            value = this.expr(amount.left); unit = 'rotations';
                        } else {
                            value = this.expr(amount);
                            this.note(`${fn}: a computed degree count keeps its sign in the block; the direction is taken from the velocity`);
                        }
                    }
                    return [...stopKw(P), ...lines, `run motor ${P} ${s < 0 ? 'backward' : 'forward'} ${this.tok(value)} ${unit}`];
                }
                case 'motor.run_to_absolute_position': {
                    const P = needPort(port(0));
                    if (!P) break;
                    notAwaited();
                    this.extraKeywords(call, fn, ['stop', 'direction', 'velocity', 'position']);
                    const dir = this.kw(call, 'direction');
                    if (dir && !/SHORTEST_PATH$/.test(this.qual(dir) || '')) this.note(`${fn}: direction=${this.qual(dir)} is not carried; the block takes its own path`);
                    const { lines } = speedLine(P, this.arg(call, 2, 'velocity'));
                    return [...stopKw(P), ...lines, `run motor ${P} to position ${this.expr(this.arg(call, 1, 'position'))}`];
                }
                case 'motor.run_to_relative_position': {
                    const P = needPort(port(0));
                    if (!P) break;
                    notAwaited();
                    this.extraKeywords(call, fn, ['stop', 'velocity', 'position']);
                    const { lines } = speedLine(P, this.arg(call, 2, 'velocity'));
                    const delta = this.tok(`${this.expr(this.arg(call, 1, 'position'))} - (spike motor relative position ${P})`);
                    this.note(`${fn}: run as the difference from the current relative position, a signed degree count`);
                    return [...stopKw(P), ...lines, `run motor ${P} forward ${delta} degrees`];
                }
                case 'motor.reset_relative_position': {
                    const P = needPort(port(0));
                    if (!P) break;
                    return [`reset motor position ${P} to ${this.expr(this.arg(call, 1, 'position'))}`];
                }
                case 'motor.set_duty_cycle': {
                    const P = needPort(port(0));
                    if (!P) break;
                    this.note('motor.set_duty_cycle(): power is run as a speed, pwm/100 percent');
                    const pwm = this.arg(call, 1, 'pwm');
                    const n = lit(pwm);
                    const speed = n !== null ? fmt(n / 100) : this.tok(`${this.expr(pwm)} / 100`);
                    return [`set motor speed ${P} ${speed}`, `start motor ${P} forward`];
                }

                // ── motor_pair ───────────────────────────────────────────
                case 'motor_pair.pair': {
                    const slot = this.pairSlot(call.args[0]);
                    const L = this.port(call.args[1]), R = this.port(call.args[2]);
                    if (slot === null || !L || !R) return [this.refuse('motor_pair.pair() with a slot or port that is not a constant')];
                    this.pairs.set(slot, { left: L, right: R });
                    return [`set movement motors ${L} ${R}`];
                }
                case 'motor_pair.unpair':
                    this.note('motor_pair.unpair(): the blocks keep one drive base; nothing to undo');
                    return ['# motor_pair.unpair(): nothing to undo in the blocks'];
                case 'motor_pair.stop': {
                    const sel = selectPair(call.args[0]);
                    if (!sel.ok) return sel.lines;
                    if (this.kw(call, 'stop')) this.note(`${fn}: stop= is not carried; the drive base's stop action is used`);
                    return [...sel.lines, 'stop movement'];
                }
                case 'motor_pair.move': {
                    const sel = selectPair(call.args[0]);
                    if (!sel.ok) return sel.lines;
                    this.extraKeywords(call, fn, ['velocity', 'steering']);
                    const steering = this.tok(this.expr(this.arg(call, 1, 'steering')));
                    const velocity = this.kw(call, 'velocity');
                    if (velocity === undefined) this.note(VELOCITY_NOTE);
                    const speed = velocity === undefined ? fmt(360 / VELOCITY_PER_PERCENT) : this.scaledDown(velocity, VELOCITY_PER_PERCENT);
                    return [...sel.lines, `start moving steering ${steering} at speed ${speed}`];
                }
                case 'motor_pair.move_tank': {
                    const sel = selectPair(call.args[0]);
                    if (!sel.ok) return sel.lines;
                    this.extraKeywords(call, fn, ['left_velocity', 'right_velocity']);
                    const l = this.tok(this.scaledDown(this.arg(call, 1, 'left_velocity'), VELOCITY_PER_PERCENT));
                    const r = this.scaledDown(this.arg(call, 2, 'right_velocity'), VELOCITY_PER_PERCENT);
                    return [...sel.lines, `start tank drive left ${l} right ${r}`];
                }
                case 'motor_pair.move_for_degrees':
                case 'motor_pair.move_for_time': {
                    const sel = selectPair(call.args[0]);
                    if (!sel.ok) return sel.lines;
                    notAwaited();
                    const timed = fn === 'motor_pair.move_for_time';
                    this.extraKeywords(call, fn, ['velocity', 'stop', 'steering', 'degrees', 'duration']);
                    if (this.kw(call, 'stop')) this.note(`${fn}: stop= is not carried; the drive base's stop action is used`);
                    const amount = this.arg(call, 1, timed ? 'duration' : 'degrees');
                    const steerNode = this.arg(call, 2, 'steering');
                    const velocity = this.kw(call, 'velocity');
                    if (lit(steerNode) === 0) {
                        const { lines, sign } = moveSpeed(velocity);
                        if (timed) return [...sel.lines, ...lines, `move ${sign < 0 ? 'backward' : 'forward'} ${this.tok(this.seconds(amount))} seconds`];
                        const n = lit(amount);
                        let s = sign, value, unit = 'degrees';
                        if (n !== null) { value = fmt(Math.abs(n)); if (n < 0) s = -s; } else {
                            const inner = this.unwrap(amount);
                            const cm = inner.type === 'BinOp' && inner.op === '/' && inner.left.type === 'BinOp' && inner.left.op === '*' &&
                                lit(inner.left.right) === 360 ? lit(inner.right) : null;
                            if (cm === CM_PER_ROTATION || cm === IN_PER_ROTATION) {
                                value = this.expr(inner.left.left); unit = cm === CM_PER_ROTATION ? 'cm' : 'inches';
                            } else if (inner.type === 'BinOp' && inner.op === '*' && lit(inner.right) === 360) {
                                value = this.expr(inner.left); unit = 'rotations';
                            } else {
                                value = this.expr(amount);
                                this.note(`${fn}: a computed degree count keeps its sign in the block; the direction is taken from the velocity`);
                            }
                        }
                        return [...sel.lines, ...lines, `move ${s < 0 ? 'backward' : 'forward'} ${this.tok(value)} ${unit}`];
                    }
                    // Steered: no single block. Start the steered move, wait for the
                    // wheels (or the time), stop — which is the move it describes.
                    const steering = this.tok(this.expr(steerNode));
                    if (velocity === undefined) this.note(VELOCITY_NOTE);
                    const speed = velocity === undefined ? fmt(360 / VELOCITY_PER_PERCENT) : this.scaledDown(velocity, VELOCITY_PER_PERCENT);
                    const n = lit(amount);
                    const signedSpeed = n !== null && n < 0 && !timed ? this.tok(`0 - ${speed}`) : speed;
                    const start = [`start moving steering ${steering} at speed ${signedSpeed}`];
                    if (timed) return [...sel.lines, ...start, `wait ${this.seconds(amount)} seconds`, 'stop movement'];
                    return [...sel.lines, ...turnWheels(sel.pair, n !== null ? fmt(Math.abs(n)) : `(${this.expr(amount)})`, start)];
                }
                case 'motor_pair.move_tank_for_degrees':
                case 'motor_pair.move_tank_for_time': {
                    const sel = selectPair(call.args[0]);
                    if (!sel.ok) return sel.lines;
                    notAwaited();
                    const timed = fn === 'motor_pair.move_tank_for_time';
                    this.extraKeywords(call, fn, ['stop', 'left_velocity', 'right_velocity', 'degrees', 'duration']);
                    if (this.kw(call, 'stop')) this.note(`${fn}: stop= is not carried; the drive base's stop action is used`);
                    const lv = this.arg(call, timed ? 1 : 2, 'left_velocity');
                    const rv = this.arg(call, timed ? 2 : 3, 'right_velocity');
                    const amount = this.arg(call, timed ? 3 : 1, timed ? 'duration' : 'degrees');
                    const start = [`start tank drive left ${this.tok(this.scaledDown(lv, VELOCITY_PER_PERCENT))} right ${this.scaledDown(rv, VELOCITY_PER_PERCENT)}`];
                    if (timed) return [...sel.lines, ...start, `wait ${this.seconds(amount)} seconds`, 'stop movement'];
                    const n = lit(amount);
                    return [...sel.lines, ...turnWheels(sel.pair, n !== null ? fmt(Math.abs(n)) : `(${this.expr(amount)})`, start)];
                }

                // ── hub.light_matrix ─────────────────────────────────────
                case 'light_matrix.write': {
                    this.extraKeywords(call, fn, ['text']);
                    const t = this.arg(call, 0, 'text');
                    if (t && t.type === 'Str') return [`display text ${JSON.stringify(t.value)}`];
                    const v = this.stripOuterParens(this.expr(this.unwrap(t)));
                    return [`display text ${v.startsWith('"') ? `(${v})` : SIMPLE_TOKEN.test(v) ? v : `(${v})`}`];
                }
                case 'light_matrix.clear': return ['display clear'];
                case 'light_matrix.show_image': {
                    this.note('light_matrix.show_image(): the blocks show built-in image N by number; which picture that is depends on the hub');
                    return [`display image ${this.expr(this.arg(call, 0, 'image'))}`];
                }
                case 'light_matrix.set_pixel': {
                    const plus1 = (node) => {
                        const n = lit(node);
                        if (n !== null) return fmt(n + 1);
                        if (node.type === 'BinOp' && node.op === '-' && lit(node.right) === 1) return this.tok(this.expr(node.left));
                        return this.tok(`${this.expr(node)} + 1`);
                    };
                    const x = plus1(this.arg(call, 0, 'x')), y = plus1(this.arg(call, 1, 'y'));
                    return [`set pixel ${x} ${y} ${this.tok(this.expr(this.arg(call, 2, 'intensity')))}`];
                }

                // ── hub.sound ────────────────────────────────────────────
                case 'sound.beep': {
                    this.extraKeywords(call, fn, ['freq', 'duration', 'volume']);
                    const f = this.arg(call, 0, 'freq'), d = this.arg(call, 1, 'duration'), v = this.arg(call, 2, 'volume');
                    if (v !== undefined && lit(v) !== 100) this.note('sound.beep(): volume is not carried; the hub volume is used');
                    return [`play beep ${f === undefined ? '440' : this.tok(this.expr(f))} ${d === undefined ? '500' : this.tok(this.expr(d))}`];
                }
                case 'sound.stop': return ['stop sound'];

                // ── hub.motion_sensor ────────────────────────────────────
                case 'motion_sensor.reset_yaw': {
                    const a = this.arg(call, 0, 'angle');
                    const n = a === undefined ? 0 : lit(a);
                    if (n === 0) return ['reset yaw'];
                    if (n !== null) return [`preset yaw to ${fmt(-n / 10)}`];
                    if (a.type === 'BinOp' && a.op === '*' && lit(a.right) === -10) return [`preset yaw to ${this.expr(a.left)}`];
                    return [`preset yaw to ((0 - ${this.expr(a)}) / 10)`];
                }

                // ── runloop ──────────────────────────────────────────────
                case 'runloop.sleep_ms': return [`wait ${this.seconds(this.arg(call, 0, 'duration'))} seconds`];
                case 'runloop.until': {
                    const f = call.args[0];
                    if (call.args[1] || this.kw(call, 'timeout')) this.note('runloop.until(): the timeout is not carried; the block waits for the condition alone');
                    let cond = null;
                    if (f && f.type === 'Lambda' && !f.args.length) cond = this.expr(f.body);
                    else if (f && f.type === 'Name' && this.predicates.has(f.id)) cond = this.expr(this.predicates.get(f.id));
                    else if (f && f.type === 'Call' && this.callPath(f)) {
                        this.note('runloop.until(): given a call rather than a function; its value is re-read each time');
                        cond = this.expr(f);
                    }
                    if (cond === null) return [this.refuse('runloop.until() with a function that is not a lambda or a one-line def')];
                    return [`wait until ${this.stripOuterParens(cond)}`];
                }
                case 'runloop.run': return [this.refuse('runloop.run() inside a function')];
                default: break;
            }
            return [this.refuse(`${fn}()`)];
        }

        // ── the program ───────────────────────────────────────────────────

        readImports (source) {
            for (const raw of String(source).split('\n')) {
                const line = raw.replace(/#.*$/, '').trim();
                let m;
                if ((m = /^import\s+(.+)$/.exec(line))) {
                    for (const part of m[1].split(',')) {
                        const mm = /^\s*([\w.]+)(?:\s+as\s+(\w+))?\s*$/.exec(part);
                        if (mm) this.modules.set(mm[2] || mm[1].split('.')[0], mm[2] ? mm[1] : mm[1].split('.')[0]);
                    }
                } else if ((m = /^from\s+([\w.]+)\s+import\s+\(?([^)]*)\)?$/.exec(line))) {
                    for (const part of m[2].split(',')) {
                        const mm = /^\s*(\w+)(?:\s+as\s+(\w+))?\s*$/.exec(part);
                        if (mm) this.modules.set(mm[2] || mm[1], `${m[1]}.${mm[1]}`.replace(/^hub\./, ''));
                    }
                }
            }
        }

        spikeProgram (ast, source) {
            this.readImports(source);
            const defs = new Map();
            const entries = [];
            const prologue = [];
            // First pass: constants, functions, pairs used.
            for (const s of ast.body) {
                if (s.type === 'Def') { defs.set(s.name, s); this.userFunctions.add(s.name); continue; }
                if (s.type === 'Assign' && s.target.type === 'Name') {
                    const q = this.qual(s.value) || '';
                    if (/^(port\.[A-F]|motor_pair\.PAIR_[123])$/.test(q)) this.constants.set(s.target.id, s.value);
                }
            }
            for (const [name, d] of defs) {
                const body = d.body.filter((st) => !(st.type === 'Expr' && st.value && st.value.type === 'Str'));
                if (body.length === 1 && body[0].type === 'Return' && body[0].value) this.predicates.set(name, body[0].value);
            }
            const scanPairs = (node) => {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node)) { node.forEach(scanPairs); return; }
                if (node.type === 'Call' && this.callPath(node) === 'motor_pair.pair') {
                    // Known before any body is read: a helper def that drives the
                    // pair is translated before the entry that paired it.
                    const slot = this.pairSlot(node.args[0]);
                    const L = this.port(node.args[1]), R = this.port(node.args[2]);
                    if (slot !== null) this.pairSlotsUsed.add(slot);
                    if (slot !== null && L && R && !this.pairs.has(slot)) this.pairs.set(slot, { left: L, right: R });
                }
                for (const v of Object.values(node)) if (v && typeof v === 'object') scanPairs(v);
            };
            scanPairs(ast.body);

            // Second pass: the module body, in order.
            for (const s of ast.body) {
                if (s.type === 'Def') continue;
                if (s.type === 'Assign' && s.target.type === 'Name' && this.constants.has(s.target.id)) continue;
                if (s.type === 'Assign' && s.target.type === 'Name' && /^_bw_(speed|stop)$/.test(s.target.id)) continue;
                if (s.type === 'Assign' && s.target.type === 'Name' && s.target.id === '_bw_move_speed' &&
                    literalNumber(s.value) !== null) continue;   // the exporter's declaration; its value is the extension default
                if (s.type === 'Assign' && s.target.type === 'Name' && literalNumber(s.value) === 0) continue; // a declaration
                if (s.type === 'Expr' && s.value && s.value.type === 'Str') continue;                   // a docstring
                if (s.type === 'Expr' && this.callPath(s.value) === 'runloop.run') {
                    for (const a of s.value.args) {
                        const name = a && a.type === 'Call' && a.func.type === 'Name' ? a.func.id : null;
                        if (name && defs.has(name)) entries.push(name);
                        else prologue.push(this.pad(1) + this.refuse('runloop.run() of something that is not a call to a def in this file'));
                    }
                    continue;
                }
                prologue.push(...this.stmt(s, 1));
            }

            // Functions called by the program become custom blocks; entries become
            // flag scripts. A function that is both gets both.
            const called = new Set();
            const scanCalls = (node) => {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node)) { node.forEach(scanCalls); return; }
                if (node.type === 'Call' && node.func && node.func.type === 'Name' && defs.has(node.func.id)) called.add(node.func.id);
                for (const [k, v] of Object.entries(node)) if (k !== 'func' && v && typeof v === 'object') scanCalls(v);
            };
            for (const d of defs.values()) scanCalls(d.body);
            scanCalls(ast.body.filter((s) => !(s.type === 'Expr' && this.callPath(s.value) === 'runloop.run')));

            const statementCalls = new Set();
            const scanStatementCalls = (node) => {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node)) { node.forEach(scanStatementCalls); return; }
                if (node.type === 'Expr') {
                    const v = node.value && node.value.type === 'Await' ? node.value.value : node.value;
                    if (v && v.type === 'Call' && v.func.type === 'Name') statementCalls.add(v.func.id);
                }
                for (const v of Object.values(node)) if (v && typeof v === 'object') scanStatementCalls(v);
            };
            scanStatementCalls(ast.body);
            const lines = ['DEVICE SPIKE', ''];
            for (const [name, d] of defs) {
                if (entries.includes(name) && !called.has(name)) continue;
                // A one-line predicate (`def is_red(): return …`) is inlined where it is
                // read; it becomes a custom block only if it is also called for effect.
                if (this.predicates.has(name) && !statementCalls.has(name)) continue;
                const params = d.args.map((a) => `(${this.vname(a)})`).join(' ');
                this.line = d.line;
                lines.push(`DEFINE ${name}${params ? ' ' + params : ''}:`);
                const body = this.block(d.body, 1);
                lines.push(...(body.length ? body : [this.pad(1) + 'stop this script']), '');
            }
            const flagScripts = entries.length ? entries : (prologue.length ? [null] : []);
            if (entries.length > 1 && prologue.some((l) => !/^\s*(set |#)/.test(l))) {
                this.note('module-level statements run at the start of the first runloop.run() entry only');
            }
            flagScripts.forEach((name, i) => {
                const body = [];
                if (i === 0) body.push(...prologue);
                if (name) {
                    const d = defs.get(name);
                    this.line = d.line;
                    if (called.has(name)) body.push(this.pad(1) + name);
                    else body.push(...this.block(d.body, 1));
                }
                lines.push('WHEN flag clicked:', ...(body.length ? body : [this.pad(1) + 'stop this script']), '');
            });
            if (!flagScripts.length) this.note('no runloop.run() and no module-level statements: nothing runs');
            const header = [...this.renamed].map(([from, to]) =>
                `# "${from}" is written as "${to}" here: the pseudocode reads a bare "${from}" as a Scratch block.`);
            return [...header, ...lines].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
        }
    };
    return Spike3TranslatorClass;
}

/**
 * SPIKE App 3 Python -> SPIKE dialect pseudocode.
 * @returns {{pseudocode: string, warnings: string[], unsupported: string[], notes: string[]}}
 */
export function spike3PythonToPseudocode (source) {
    if (!source || !String(source).trim()) throw new Error('Python source is empty');
    const tokens = new Tokenizer(String(source)).tokenize();
    const ast = new Parser(tokens).parseProgram();
    const Cls = translatorClass();
    const t = new Cls();
    const pseudocode = t.spikeProgram(ast, source);
    return { pseudocode, warnings: t.warnings, unsupported: t.unsupported, notes: t.notes, dialect: 'spike3' };
}

// ═══════════════════════════════════════════════════════════════════════════
// blocks -> SPIKE App 3 Python
// ═══════════════════════════════════════════════════════════════════════════

const HEADER = [
    '# SPIKE App 3 Python, written by Brickwright from blocks.',
    '# _bw_speed / _bw_move_speed hold the speeds the blocks set (percent);',
    `# one percent is ${VELOCITY_PER_PERCENT} degrees per second here.`,
    'from hub import port, light_matrix, sound, motion_sensor, button',
    'import motor',
    'import motor_pair',
    'import color_sensor',
    'import distance_sensor',
    'import force_sensor',
    'import color',
    'import runloop',
    ''
];

/** SB3Creator.boolishTruthTest's rule, restated so this module need not import the compiler. */
function boolishTruth (b) {
    const lit = (k) => {
        const inner = Array.isArray(b.inputs[k]) ? b.inputs[k][1] : null;
        return Array.isArray(inner) && (inner[0] === 10 || inner[0] === 4) ? String(inner[1]) : null;
    };
    const l = lit('OPERAND1'), r = lit('OPERAND2');
    if (/^true$/i.test(r || '')) return { key: 'OPERAND1', negate: false };
    if (/^false$/i.test(r || '')) return { key: 'OPERAND1', negate: true };
    if (/^true$/i.test(l || '')) return { key: 'OPERAND2', negate: false };
    if (/^false$/i.test(l || '')) return { key: 'OPERAND2', negate: true };
    return null;
}

const pyIdent = (name) => {
    let s = String(name).replace(/[^A-Za-z0-9_]/g, '_');
    if (/^\d/.test(s)) s = `v_${s}`;
    return s || 'v';
};

/**
 * A project's blocks as SPIKE App 3 Python.
 * @returns {{py: string, unsupported: string[]}}
 */
export function projectToSpike3Python (project) {
    const unsupported = [];
    const refuse = (what) => { unsupported.push(what); return what; };
    const targets = (project && project.targets) || [];
    const vars = new Map();     // id -> python name
    for (const t of targets) {
        for (const [id, v] of Object.entries(t.variables || {})) vars.set(id, pyIdent(v[0]));
    }
    const out = [...HEADER, '_bw_speed = [75] * 6', '_bw_stop = [motor.BRAKE] * 6', '_bw_move_speed = 50'];
    let usesRandom = false;
    for (const name of new Set(vars.values())) out.push(`${name} = 0`);
    out.push('');

    const funcs = [];
    const entries = [];

    for (const t of targets) {
        const blocks = t.blocks || {};
        const B = (id) => blocks[id];
        const field = (b, k) => (b.fields && b.fields[k] ? b.fields[k][0] : '');
        const PORT = (b, k = 'PORT') => `port.${String(field(b, k) || 'A').toUpperCase()}`;
        const assigned = new Set();

        const val = (input) => {
            if (!Array.isArray(input)) return '0';
            const inner = input[1];
            if (Array.isArray(inner)) {
                const [type, a] = inner;
                if (type === 12) return vars.get(inner[2]) || pyIdent(a);
                if (type === 10) {
                    const n = Number(a);
                    return a !== '' && Number.isFinite(n) && String(a).trim() === String(a) ? String(a) : JSON.stringify(String(a));
                }
                return String(a);
            }
            return rep(B(inner));
        };
        const lit = (input) => {
            const s = val(input);
            return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
        };
        const times = (input, k) => {
            const n = lit(input);
            if (n !== null) return fmt(n * k);
            return `${wrapOp(val(input))} * ${k}`;
        };
        const wrapOp = (s) => (/^[\w.]+(\(.*\))?(\[\d+\])?$/.test(s) || /^-?\d/.test(s) && /^-?[\d.]+$/.test(s) ? s : `(${s})`);
        const cond = (input) => {
            if (!Array.isArray(input) || !input[1]) return 'False';
            return rep(B(input[1]));
        };
        const colorOf = (b) => {
            const name = String(field(b, 'COLOR') || '').toLowerCase();
            return COLOR_BY_NAME[name] ? `color.${COLOR_BY_NAME[name]}` : JSON.stringify(name);
        };

        function rep (b) {
            if (!b) return '0';
            const o = b.opcode;
            const bin = (op) => `(${val(b.inputs.NUM1)} ${op} ${val(b.inputs.NUM2)})`;
            switch (o) {
                case 'operator_add': return bin('+');
                case 'operator_subtract': return bin('-');
                case 'operator_multiply': return bin('*');
                case 'operator_divide': return bin('/');
                case 'operator_mod': return bin('%');
                case 'operator_random': usesRandom = true; return `random.randint(${val(b.inputs.FROM)}, ${val(b.inputs.TO)})`;
                case 'operator_round': return `round(${val(b.inputs.NUM)})`;
                case 'operator_join': return `(str(${val(b.inputs.STRING1)}) + str(${val(b.inputs.STRING2)}))`;
                case 'operator_length': return `len(str(${val(b.inputs.STRING)}))`;
                case 'operator_lt': return `(${val(b.inputs.OPERAND1)} < ${val(b.inputs.OPERAND2)})`;
                case 'operator_gt': return `(${val(b.inputs.OPERAND1)} > ${val(b.inputs.OPERAND2)})`;
                case 'operator_equals': {
                    // `<boolean> = "true"` is how the dialect writes a boolean reporter
                    // used as a condition (SB3Creator.boolishTruthTest). In Python the
                    // reporter already is the truth value; comparing it with the
                    // string "true" would always be False.
                    const truth = boolishTruth(b);
                    if (truth) return truth.negate ? `(not ${val(b.inputs[truth.key])})` : val(b.inputs[truth.key]);
                    const l = B(b.inputs.OPERAND1 && b.inputs.OPERAND1[1]);
                    const r = b.inputs.OPERAND2;
                    // spike color P = "red"  ->  compare with the color constant
                    if (l && l.opcode === 'spikeprime_getColor' && Array.isArray(r) && Array.isArray(r[1]) && COLOR_BY_NAME[String(r[1][1]).toLowerCase()]) {
                        return `(color_sensor.color(${PORT(l)}) == color.${COLOR_BY_NAME[String(r[1][1]).toLowerCase()]})`;
                    }
                    if (l && l.opcode === 'spikeprime_getFaceUp' && Array.isArray(r) && Array.isArray(r[1]) && FACE_BY_NAME[String(r[1][1]).toLowerCase()]) {
                        return `(motion_sensor.up_face() == motion_sensor.${FACE_BY_NAME[String(r[1][1]).toLowerCase()]})`;
                    }
                    return `(${val(b.inputs.OPERAND1)} == ${val(b.inputs.OPERAND2)})`;
                }
                case 'operator_and': return `(${cond(b.inputs.OPERAND1)} and ${cond(b.inputs.OPERAND2)})`;
                case 'operator_or': return `(${cond(b.inputs.OPERAND1)} or ${cond(b.inputs.OPERAND2)})`;
                case 'operator_not': return `(not ${cond(b.inputs.OPERAND)})`;
                case 'operator_mathop': {
                    const op = String(field(b, 'OPERATOR')).toLowerCase();
                    const x = val(b.inputs.NUM);
                    if (op === 'abs') return `abs(${x})`;
                    refuse(`the ${op} of block has no SPIKE 3 Python spelling here`);
                    return x;
                }
                case 'data_variable': return vars.get(b.fields.VARIABLE[1]) || pyIdent(b.fields.VARIABLE[0]);
                case 'argument_reporter_string_number': case 'argument_reporter_boolean': return pyIdent(field(b, 'VALUE'));
                case 'spikeprime_getDistance': return `(distance_sensor.distance(${PORT(b)}) / 10)`;
                case 'spikeprime_getDistanceIn': {
                    const d = { mm: '', cm: ' / 10', in: ' / 25.4', '%': ' / 20' }[field(b, 'UNIT')] ?? ' / 10';
                    return d ? `(distance_sensor.distance(${PORT(b)})${d})` : `distance_sensor.distance(${PORT(b)})`;
                }
                case 'spikeprime_getColor': return `color_sensor.color(${PORT(b)})`;
                case 'spikeprime_isColor': return `(color_sensor.color(${PORT(b)}) == ${colorOf(b)})`;
                case 'spikeprime_getReflection': return `color_sensor.reflection(${PORT(b)})`;
                case 'spikeprime_getForce': return `force_sensor.force(${PORT(b)})`;
                case 'spikeprime_isForceSensorPressed': return `force_sensor.pressed(${PORT(b)})`;
                case 'spikeprime_getRelativePosition': return `motor.relative_position(${PORT(b)})`;
                case 'spikeprime_getPosition': return `(motor.absolute_position(${PORT(b)}) % 360)`;
                case 'spikeprime_getSpeed': return `motor.velocity(${PORT(b)})`;
                case 'spikeprime_getFaceUp': return 'motion_sensor.up_face()';
                case 'spikeprime_getAngle': {
                    const axis = field(b, 'AXIS');
                    if (axis === 'yaw') return '(motion_sensor.tilt_angles()[0] / -10)';
                    return `(motion_sensor.tilt_angles()[${axis === 'pitch' ? 1 : 2}] / 10)`;
                }
                case 'spikeprime_getAcceleration': return `motion_sensor.acceleration()[${'xyz'.indexOf(field(b, 'AXIS')) >= 0 ? 'xyz'.indexOf(field(b, 'AXIS')) : 0}]`;
                case 'spikeprime_isButtonPressed': {
                    const which = field(b, 'BUTTON');
                    if (which === 'left' || which === 'right') return `button.pressed(button.${which.toUpperCase()})`;
                    refuse(`spike button ${which} pressed`);
                    return 'False';
                }
                default:
                    refuse(`reporter ${o}`);
                    return '0';
            }
        }

        const stmts = (id, ind) => {
            const lines = [];
            let cur = id;
            while (cur) {
                const b = B(cur);
                if (!b) break;
                lines.push(...stmt(b, ind));
                cur = b.next;
            }
            return lines;
        };
        const body = (b, key, ind) => {
            const sub = b.inputs && b.inputs[key] ? b.inputs[key][1] : null;
            const lines = sub ? stmts(sub, ind) : [];
            return lines.length ? lines : ['    '.repeat(ind) + 'pass'];
        };

        function stmt (b, ind) {
            const p = '    '.repeat(ind);
            const o = b.opcode;
            const line = (...ls) => ls.map((l) => p + l);
            switch (o) {
                case 'control_forever': return [p + 'while True:', ...body(b, 'SUBSTACK', ind + 1)];
                case 'control_repeat': {
                    const n = lit(b.inputs.TIMES);
                    return [p + `for _ in range(${n !== null ? fmt(n) : `int(${val(b.inputs.TIMES)})`}):`, ...body(b, 'SUBSTACK', ind + 1)];
                }
                case 'control_repeat_until': return [p + `while not ${cond(b.inputs.CONDITION)}:`, ...body(b, 'SUBSTACK', ind + 1)];
                case 'control_if': return [p + `if ${cond(b.inputs.CONDITION)}:`, ...body(b, 'SUBSTACK', ind + 1)];
                case 'control_if_else': return [p + `if ${cond(b.inputs.CONDITION)}:`, ...body(b, 'SUBSTACK', ind + 1), p + 'else:', ...body(b, 'SUBSTACK2', ind + 1)];
                case 'control_wait': {
                    const d = B(b.inputs.DURATION && b.inputs.DURATION[1]);
                    if (d && d.opcode === 'operator_divide' && lit(d.inputs.NUM2) === 1000) return line(`await runloop.sleep_ms(${val(d.inputs.NUM1)})`);
                    const n = lit(b.inputs.DURATION);
                    return line(`await runloop.sleep_ms(${n !== null ? fmt(n * 1000) : `int(${wrapOp(val(b.inputs.DURATION))} * 1000)`})`);
                }
                case 'control_wait_until': return line(`await runloop.until(lambda: ${cond(b.inputs.CONDITION)})`);
                case 'control_stop': {
                    const opt = field(b, 'STOP_OPTION');
                    if (opt === 'this script') return line('return');
                    return line(`# unsupported: ${refuse(`stop ${opt}`)}`);
                }
                case 'data_setvariableto': {
                    const n = vars.get(b.fields.VARIABLE[1]) || pyIdent(b.fields.VARIABLE[0]);
                    assigned.add(n);
                    return line(`${n} = ${val(b.inputs.VALUE)}`);
                }
                case 'data_changevariableby': {
                    const n = vars.get(b.fields.VARIABLE[1]) || pyIdent(b.fields.VARIABLE[0]);
                    assigned.add(n);
                    return line(`${n} += ${val(b.inputs.VALUE)}`);
                }
                case 'looks_say': return line(`print(${val(b.inputs.MESSAGE)})`);
                case 'procedures_call': {
                    const m = b.mutation || {};
                    const words = String(m.proccode || '').split(/\s+/).filter((w) => !/^%[sbn]$/.test(w));
                    const ids = JSON.parse(m.argumentids || '[]');
                    return line(`await ${pyIdent(words.join('_'))}(${ids.map((id) => val(b.inputs[id])).join(', ')})`);
                }
                // ── spikeprime ──────────────────────────────────────────
                case 'spikeprime_motorSetSpeed': return line(`_bw_speed[${PORT(b)}] = ${val(b.inputs.SPEED)}`);
                case 'spikeprime_motorStart': return line(`motor.run(${PORT(b)}, _bw_speed[${PORT(b)}] * ${String(field(b, 'DIRECTION')) === '-1' ? -10 : 10})`);
                case 'spikeprime_motorStop': return line(`motor.stop(${PORT(b)})`);
                case 'spikeprime_motorRunFor': {
                    const P = PORT(b);
                    const v = `_bw_speed[${P}] * ${String(field(b, 'DIRECTION')) === '-1' ? -10 : 10}`;
                    const unit = String(field(b, 'UNIT'));
                    if (/^second/.test(unit)) {
                        const n = lit(b.inputs.VALUE);
                        return line(`await motor.run_for_time(${P}, ${n !== null ? fmt(n * 1000) : `int(${wrapOp(val(b.inputs.VALUE))} * 1000)`}, ${v})`);
                    }
                    const deg = /^rotation/.test(unit) ? `${wrapOp(val(b.inputs.VALUE))} * 360` : val(b.inputs.VALUE);
                    return line(`await motor.run_for_degrees(${P}, ${deg}, ${v})`);
                }
                case 'spikeprime_motorRunToPosition': return line(`await motor.run_to_absolute_position(${PORT(b)}, ${val(b.inputs.POSITION)}, _bw_speed[${PORT(b)}] * 10)`);
                case 'spikeprime_resetMotorPosition': return line(`motor.reset_relative_position(${PORT(b)}, ${val(b.inputs.POSITION)})`);
                case 'spikeprime_motorSetStopAction': return line(`_bw_stop[${PORT(b)}] = motor.${String(field(b, 'ACTION')).toUpperCase()}`);
                case 'spikeprime_setMovementMotors': return line(`motor_pair.pair(motor_pair.PAIR_1, ${PORT(b, 'PORT_A')}, ${PORT(b, 'PORT_B')})`);
                case 'spikeprime_setMovementSpeed': assigned.add('_bw_move_speed'); return line(`_bw_move_speed = ${val(b.inputs.SPEED)}`);
                case 'spikeprime_moveForward': {
                    const back = String(field(b, 'DIRECTION')) === 'backward';
                    const v = `velocity=_bw_move_speed * ${back ? -10 : 10}`;
                    const unit = String(field(b, 'UNIT'));
                    const V = wrapOp(val(b.inputs.VALUE));
                    if (/^second/.test(unit)) {
                        const n = lit(b.inputs.VALUE);
                        return line(`await motor_pair.move_for_time(motor_pair.PAIR_1, ${n !== null ? fmt(n * 1000) : `int(${V} * 1000)`}, 0, ${v})`);
                    }
                    const deg = /^rotation/.test(unit) ? `${V} * 360`
                        : unit === 'cm' ? `int(${V} * 360 / ${CM_PER_ROTATION})`
                            : unit === 'in' || unit === 'inche' ? `int(${V} * 360 / ${IN_PER_ROTATION})` : val(b.inputs.VALUE);
                    return line(`await motor_pair.move_for_degrees(motor_pair.PAIR_1, ${deg}, 0, ${v})`);
                }
                case 'spikeprime_motorPairMove': return line(`motor_pair.move(motor_pair.PAIR_1, ${val(b.inputs.STEERING)}, velocity=${times(b.inputs.SPEED, 10)})`);
                case 'spikeprime_startTank': return line(`motor_pair.move_tank(motor_pair.PAIR_1, ${times(b.inputs.LEFT_SPEED, 10)}, ${times(b.inputs.RIGHT_SPEED, 10)})`);
                case 'spikeprime_stopMovement': return line('motor_pair.stop(motor_pair.PAIR_1)');
                case 'spikeprime_displayText': return line(`await light_matrix.write(${wrapStr(val(b.inputs.TEXT))})`);
                case 'spikeprime_displayClear': return line('light_matrix.clear()');
                case 'spikeprime_displayShowImage': {
                    const n = lit(b.inputs.IMAGE);
                    const named = n !== null && Number.isInteger(n) && LIGHT_MATRIX_IMAGES[n - 1];
                    return line(`light_matrix.show_image(${named ? `light_matrix.IMAGE_${named}` : val(b.inputs.IMAGE)})`);
                }
                case 'spikeprime_setPixel': {
                    const m1 = (input) => { const n = lit(input); return n !== null ? fmt(n - 1) : `${wrapOp(val(input))} - 1`; };
                    return line(`light_matrix.set_pixel(${m1(b.inputs.X)}, ${m1(b.inputs.Y)}, ${val(b.inputs.BRIGHTNESS)})`);
                }
                case 'spikeprime_playBeep': return line(`await sound.beep(${val(b.inputs.FREQUENCY)}, ${val(b.inputs.DURATION)})`);
                case 'spikeprime_stopSound': return line('sound.stop()');
                case 'spikeprime_resetYaw': return line('motion_sensor.reset_yaw(0)');
                case 'spikeprime_presetYaw': return line(`motion_sensor.reset_yaw(${times(b.inputs.ANGLE, -10)})`);
                default: return line(`# unsupported: ${refuse(`block ${o}`)}`);
            }
        }
        const wrapStr = (s) => (/^".*"$/.test(s) ? s : /^-?[\d.]+$/.test(s) ? JSON.stringify(s) : `str(${s})`);

        const tops = Object.entries(blocks).filter(([, b]) => b && b.topLevel);
        for (const [, b] of tops) {
            if (b.opcode === 'event_whenflagclicked') {
                assigned.clear();
                const lines = stmts(b.next, 1);
                const name = entries.length ? `main_${entries.length + 1}` : 'main';
                entries.push(name);
                funcs.push({ name, params: [], lines, globals: [...assigned] });
            } else if (b.opcode === 'procedures_definition') {
                assigned.clear();
                const proto = B(b.inputs.custom_block && b.inputs.custom_block[1]);
                const m = (proto && proto.mutation) || {};
                const words = String(m.proccode || '').split(/\s+/).filter((w) => !/^%[sbn]$/.test(w));
                const params = JSON.parse(m.argumentnames || '[]').map(pyIdent);
                const lines = stmts(b.next, 1);
                funcs.push({ name: pyIdent(words.join('_')), params, lines, globals: [...assigned] });
            } else if (!/^(procedures_prototype|argument_)/.test(b.opcode) && b.opcode !== 'spikeprime_menu_PORT') {
                if (/^event_/.test(b.opcode) || /^spikeprime_when/.test(b.opcode)) out.push(`# unsupported: ${refuse(`script starting with ${b.opcode}`)}`);
            }
        }
    }
    // Custom blocks first, so the entries read top to bottom as in the dialect.
    const ordered = [...funcs.filter((f) => !entries.includes(f.name)), ...funcs.filter((f) => entries.includes(f.name))];
    for (const f of ordered) {
        out.push(`async def ${f.name}(${f.params.join(', ')}):`);
        const globals = f.globals.filter((g) => !f.params.includes(g));
        if (globals.length) out.push(`    global ${globals.sort().join(', ')}`);
        out.push(...(f.lines.length ? f.lines : ['    pass']), '');
    }
    if (entries.length) out.push(`runloop.run(${entries.map((e) => `${e}()`).join(', ')})`);
    if (usesRandom) out.splice(HEADER.indexOf('import runloop') + 1, 0, 'import random');
    if (unsupported.length) out.splice(HEADER.length - 1, 0, `# NOTE: ${unsupported.length} block(s) have no SPIKE 3 Python spelling; see the # unsupported lines.`);
    return { py: out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', unsupported };
}
