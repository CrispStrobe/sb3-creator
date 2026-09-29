/**
 * The BrickWright pseudocode <-> LEGO EV3 (stock firmware) block map.
 *
 * `DEVICE EV3` programs are written in these words, and each word is one block
 * of the `ev3comprehensive` extension (the unified stock-firmware EV3
 * extension: direct commands over Web Serial / Scratch Link / bridge / HTTP,
 * and LMS bytecode). The table is the whole contract: sb3Creator.js parses a
 * line against it and decompiles a block through it, so a word cannot be
 * readable in one direction and not the other.
 *
 * WHY A TABLE AND NOT HAND-WRITTEN RULES. The SPIKE words grew as one regex
 * and one `case` per opcode, and the census that holds them had to count both
 * references per opcode to prove nothing was one-way. Here a word is data:
 * `words` is its spelling, with a slot per block argument —
 *
 *   {NAME}            a value input (number or expression; ONE token: a
 *                     number, a variable, a "quoted text" or a (parenthesised
 *                     expression), which is what the decompiler writes)
 *   {NAME:motor}      a motor-port menu input (`motorPorts`, accepts
 *                     reporters): A, B, C, D, or a pair like BC — the
 *                     extension ORs the letters into one port mask
 *   {NAME:sensor}     a sensor-port menu input (`sensorPorts`): 1..4
 *   {NAME:a|b|c}      a field; the word IS the stored value
 *   {NAME:a=A|b=B}    a field whose stored value differs from its word
 *
 * THE SLICE IS COUNTED, not implied: every opcode of the pinned extension
 * surface (runtimeRegistry.generated.js) is either a word here or in exactly
 * one exclusion class below, and test/ev3-dialect.test.mjs requires the union
 * to equal that surface.
 *
 * Reporters are prefixed `ev3` as SPIKE's are prefixed `spike`: the prefix is
 * what keeps `ev3 distance 4 cm` from ever reading as a variable. Commands
 * that drive the brick's own screen, speaker and lights say `brick`, so none
 * of them shadows the Scratch stage's `clear`, `stop all sounds` or
 * `set volume to` — which on DEVICE EV3 still mean the stage.
 */
export const EV3_EXTENSION = 'ev3comprehensive';

const MOTOR_MENU = {opcode: `${EV3_EXTENSION}_menu_motorPorts`, field: 'motorPorts'};
const SENSOR_MENU = {opcode: `${EV3_EXTENSION}_menu_sensorPorts`, field: 'sensorPorts'};

export const EV3_WORDS = Object.freeze([
    // ---- motors -------------------------------------------------------------
    {op: 'motorRun', kind: 'command', words: 'run motor {PORT:motor} at {POWER} %'},
    {op: 'motorRunTime', kind: 'command', words: 'run motor {PORT:motor} at {POWER} % for {TIME} seconds'},
    {op: 'motorRunRotations', kind: 'command', words: 'run motor {PORT:motor} at {POWER} % for {ROTATIONS} rotations'},
    {op: 'motorRunDegrees', kind: 'command', words: 'run motor {PORT:motor} at {POWER} % for {DEGREES} degrees'},
    {op: 'motorStop', kind: 'command', words: 'stop motor {PORT:motor} {BRAKE:brake|coast}'},
    {op: 'motorReset', kind: 'command', words: 'reset motor {PORT:motor}'},
    {op: 'motorPolarity', kind: 'command', words: 'set motor {PORT:motor} polarity {POLARITY:1|-1|0}'},
    // The extension drives the pair B (left) + C (right), as a stock EV3
    // driving base is wired; steering is -100..100, + turns right.
    {op: 'tankDrive', kind: 'command', words: 'tank drive {LEFT} {RIGHT} for {VALUE} {UNIT:seconds|rotations|degrees}'},
    {op: 'steerDrive', kind: 'command', words: 'steer {STEERING} at {SPEED} % for {VALUE} {UNIT:seconds|rotations|degrees}'},
    {op: 'motorPosition', kind: 'reporter', words: 'ev3 motor position {PORT:motor}'},
    {op: 'motorSpeed', kind: 'reporter', words: 'ev3 motor speed {PORT:motor}'},
    // ---- sensors ------------------------------------------------------------
    {op: 'touchSensor', kind: 'boolean', words: 'ev3 touch {PORT:sensor} pressed'},
    {op: 'touchSensorBumped', kind: 'boolean', words: 'ev3 touch {PORT:sensor} bumped'},
    {op: 'colorSensor', kind: 'reporter', words: 'ev3 color {PORT:sensor} {MODE:reflected|ambient|color|raw}'},
    {op: 'colorSensorRGB', kind: 'reporter', words: 'ev3 color {PORT:sensor} rgb {COMPONENT:red|green|blue}'},
    {op: 'ultrasonicSensor', kind: 'reporter', words: 'ev3 distance {PORT:sensor} {UNIT:cm|inch}'},
    {op: 'ultrasonicListen', kind: 'boolean', words: 'ev3 ultrasonic {PORT:sensor} detects'},
    {op: 'gyroSensor', kind: 'reporter', words: 'ev3 gyro {PORT:sensor} {MODE:angle|rate|fast|angle_rate}'},
    {op: 'gyroReset', kind: 'command', words: 'reset gyro {PORT:sensor}'},
    {op: 'irProximity', kind: 'reporter', words: 'ev3 infrared {PORT:sensor} proximity'},
    {op: 'irBeaconHeading', kind: 'reporter', words: 'ev3 infrared {PORT:sensor} beacon heading channel {CHANNEL}'},
    {op: 'irBeaconDistance', kind: 'reporter', words: 'ev3 infrared {PORT:sensor} beacon distance channel {CHANNEL}'},
    {op: 'irRemoteButton', kind: 'boolean',
        words: 'ev3 infrared {PORT:sensor} channel {CHANNEL} button {BUTTON:1|2|3|4|5|6|7|8|9|10|11} pressed'},
    // ---- the brick: screen, sound, lights, buttons, battery, timers ---------
    {op: 'screenClear', kind: 'command', words: 'clear brick screen'},
    {op: 'screenText', kind: 'command', words: 'show brick text {TEXT} at {X} {Y}'},
    {op: 'screenTextLarge', kind: 'command', words: 'show brick large text {TEXT} at {X} {Y}'},
    {op: 'drawPixel', kind: 'command', words: 'draw brick pixel {X} {Y}'},
    {op: 'drawLine', kind: 'command', words: 'draw brick line {X1} {Y1} {X2} {Y2}'},
    {op: 'drawCircle', kind: 'command', words: 'draw brick circle {X} {Y} {R} {FILL:outline|filled}'},
    {op: 'drawRectangle', kind: 'command', words: 'draw brick rectangle {X} {Y} {W} {H} {FILL:outline|filled}'},
    {op: 'screenUpdate', kind: 'command', words: 'update brick screen'},
    {op: 'screenInvert', kind: 'command', words: 'invert brick screen'},
    {op: 'playTone', kind: 'command', words: 'play brick tone {FREQ} hz for {DURATION} ms'},
    {op: 'playNote', kind: 'command', words: 'play brick note {NOTE:C4|D4|E4|F4|G4|A4|B4|C5} for {DURATION} beats'},
    {op: 'beep', kind: 'command', words: 'brick beep'},
    {op: 'setVolume', kind: 'command', words: 'set brick volume {VOLUME}'},
    {op: 'getVolume', kind: 'reporter', words: 'ev3 volume'},
    {op: 'stopSound', kind: 'command', words: 'stop brick sounds'},
    {op: 'setLED', kind: 'command', words: 'set brick light {COLOR:off=OFF|green=GREEN|red=RED|orange=ORANGE}'},
    {op: 'ledAllOff', kind: 'command', words: 'turn brick lights off'},
    {op: 'buttonPressed', kind: 'boolean', words: 'ev3 button {BUTTON:up|down|left|right|enter|back} pressed'},
    {op: 'waitForButton', kind: 'command', words: 'wait for brick button {BUTTON:up|down|left|right|enter|back}'},
    {op: 'batteryLevel', kind: 'reporter', words: 'ev3 battery level'},
    {op: 'batteryCurrent', kind: 'reporter', words: 'ev3 battery current'},
    {op: 'batteryVoltage', kind: 'reporter', words: 'ev3 battery voltage'},
    {op: 'freeMemory', kind: 'reporter', words: 'ev3 free memory'},
    {op: 'resetTimer', kind: 'command', words: 'reset brick timer {TIMER}'},
    {op: 'timerValue', kind: 'reporter', words: 'ev3 timer {TIMER}'}
]);

export const EV3_DIALECT_OPS = Object.freeze(EV3_WORDS.map(w => w.op));

export const EV3_DIALECT_EXCLUSIONS = Object.freeze({
    // Code generation and deployment act on the editor session and files, not
    // on the running program; the same as SPIKE's 'host-control'.
    'host-control': Object.freeze([
        'transpileToLMS', 'showLMSCode', 'downloadLMSCode', 'compileToRBF', 'showRBFCode',
        'downloadRBF', 'uploadAndRun', 'showDebugLog', 'testCompiler', 'setLMSApiUrl',
        // Arrived with the extensions pin bump of 2026-09-29 (upstream EV3 #5/#7).
        'testDiagnostics'
    ]),
    // Which transport reaches the brick is a property of the SESSION: the same
    // .bw program must compile unchanged over Bluetooth, USB or a bridge.
    'transport-control': Object.freeze([
        'setMode', 'connect', 'disconnect', 'isConnected', 'setBridgeHost', 'setBridgePort',
        'enableBridgeSSL', 'disableBridgeSSL', 'setBridgeAuthToken', 'clearBridgeAuthToken',
        'testBridgeConnection', 'setEV3IP', 'setEV3Port', 'testConnection',
        // Arrived with the extensions pin bump of 2026-09-29 (upstream EV3 #5/#7).
        'getConnectionMode', 'enableStreaming', 'disableStreaming'
    ]),
    // The dialect already has these as core words (`wait N seconds`); a second
    // spelling would make one program decompile two ways.
    'core-duplicate': Object.freeze(['waitSeconds', 'waitMillis']),
    // Real learner blocks that arrived with the extensions pin bump of
    // 2026-09-29 (upstream EV3 #5, the stock-firmware extensions absorbed):
    // screen drawing and the NXT light and sound sensors. Listed so the
    // denominator stays honest until each gets a word.
    'learner-gap': Object.freeze(['invertRect', 'selectFont', 'nxtLight', 'nxtSound'])
});

export const EV3_DIALECT_EXCLUSION_REASONS = Object.freeze({
    'host-control': 'editor, code-generation or deployment control; not a portable program statement',
    'transport-control': 'names the connection the session happens to use; portable program source must '
        + 'compile the same over any of them',
    'core-duplicate': 'the core `wait N seconds` block says the same; one program must decompile one way',
    'learner-gap': 'canonical learner block not yet given a dialect word'
});

// ---- the slot grammar --------------------------------------------------------

/** A word's spelling as literal tokens and slots. Cached per table entry. */
const compiled = new Map();
function compile(entry) {
    if (compiled.has(entry)) return compiled.get(entry);
    const parts = entry.words.split(/\s+/).map(tok => {
        const m = /^\{([A-Z0-9_]+)(?::(.+))?\}$/.exec(tok);
        if (!m) return {literal: tok.toLowerCase()};
        const [, name, spec] = m;
        if (spec === 'motor') return {slot: name, menu: MOTOR_MENU, pattern: /^[A-D]{1,4}$/i, upper: true};
        if (spec === 'sensor') return {slot: name, menu: SENSOR_MENU, pattern: /^[1-4]$/};
        if (spec) {
            const pairs = spec.split('|').map(p => (p.includes('=') ? p.split('=') : [p, p]));
            return {slot: name, field: true, toValue: new Map(pairs.map(([w, v]) => [w.toLowerCase(), v])),
                toWord: new Map(pairs.map(([w, v]) => [v, w]))};
        }
        return {slot: name, value: true};
    });
    const shape = {parts, literals: parts.filter(p => p.literal).length};
    compiled.set(entry, shape);
    return shape;
}

/**
 * A line or reporter split into top-level tokens: a "quoted text" (escapes
 * kept), a (parenthesised group) at any depth, or a run of anything else.
 * Returns null for unbalanced input.
 */
export function ev3Tokens(text) {
    const s = String(text).trim();
    const out = [];
    let i = 0;
    while (i < s.length) {
        if (/\s/.test(s[i])) { i++; continue; }
        const start = i;
        if (s[i] === '"') {
            i++;
            while (i < s.length && s[i] !== '"') i += s[i] === '\\' ? 2 : 1;
            if (i >= s.length) return null;
            i++;
        } else if (s[i] === '(') {
            let depth = 0;
            let inStr = false;
            for (; i < s.length; i++) {
                const c = s[i];
                if (inStr) {
                    if (c === '\\') i++;
                    else if (c === '"') inStr = false;
                    continue;
                }
                if (c === '"') inStr = true;
                else if (c === '(') depth++;
                else if (c === ')' && --depth === 0) { i++; break; }
            }
            if (depth !== 0) return null;
        } else {
            while (i < s.length && !/[\s"(]/.test(s[i])) i++;
        }
        out.push(s.slice(start, i));
    }
    return out;
}

/**
 * The table entry a text is spelled as, with its slot texts, or null.
 * `kinds` narrows the search (commands vs reporters/booleans).
 */
export function matchEv3Word(text, kinds) {
    const tokens = ev3Tokens(text);
    if (!tokens || !tokens.length) return null;
    // Cheap first-word filter: every word starts with a literal.
    const first = tokens[0].toLowerCase();
    for (const entry of EV3_WORDS) {
        if (kinds && !kinds.includes(entry.kind)) continue;
        const {parts} = compile(entry);
        if (parts.length !== tokens.length || parts[0].literal !== first) continue;
        const slots = {};
        let ok = true;
        for (let k = 0; k < parts.length && ok; k++) {
            const p = parts[k];
            const t = tokens[k];
            if (p.literal !== undefined) ok = t.toLowerCase() === p.literal;
            else if (p.menu) {
                ok = p.pattern.test(t);
                if (ok) slots[p.slot] = {menu: p.menu, value: p.upper ? t.toUpperCase() : t};
            } else if (p.field) {
                ok = p.toValue.has(t.toLowerCase());
                if (ok) slots[p.slot] = {field: p.toValue.get(t.toLowerCase())};
            } else slots[p.slot] = {value: t};
        }
        if (ok) return {entry, opcode: `${EV3_EXTENSION}_${entry.op}`, slots};
    }
    return null;
}

/**
 * Would `text` be an EV3 word if its value slots could hold more than one
 * token? That is the shape of a word whose argument is an expression written
 * without parentheses (`set brick volume a * 15`): matchEv3Word, reading one
 * token per slot, does not match it — and a generic rule then might (`set …
 * to …` made a variable named "brick volume pick random 1"). The parser asks
 * this before any generic fallback, and refuses such a line by name.
 */
export function ev3WordLoose(text, kinds) {
    const tokens = ev3Tokens(text);
    if (!tokens || !tokens.length) return null;
    for (const entry of EV3_WORDS) {
        if (kinds && !kinds.includes(entry.kind)) continue;
        const {parts} = compile(entry);
        if (!parts.some(p => p.value) || parts[0].literal !== tokens[0].toLowerCase()) continue;
        // Walk the parts; a value slot absorbs one token or more (lazily),
        // everything else must match exactly one token.
        const fits = (pi, ti) => {
            if (pi === parts.length) return ti === tokens.length;
            if (ti >= tokens.length) return false;
            const p = parts[pi], t = tokens[ti];
            if (p.literal !== undefined) return t.toLowerCase() === p.literal && fits(pi + 1, ti + 1);
            if (p.menu) return p.pattern.test(t) && fits(pi + 1, ti + 1);
            if (p.field) return p.toValue.has(t.toLowerCase()) && fits(pi + 1, ti + 1);
            for (let n = 1; ti + n <= tokens.length; n++) if (fits(pi + 1, ti + n)) return true;
            return false;
        };
        if (fits(0, 0)) return entry;
    }
    return null;
}

/** The entry for an `ev3comprehensive_*` opcode, or null. */
export function ev3WordFor(opcode) {
    const prefix = `${EV3_EXTENSION}_`;
    if (!String(opcode).startsWith(prefix)) return null;
    const op = opcode.slice(prefix.length);
    return EV3_WORDS.find(w => w.op === op) || null;
}

/**
 * Write a block back as its word. `read` supplies the three kinds of slot
 * read-out: read.menu(inputName, field), read.value(inputName),
 * read.field(fieldName).
 */
export function spellEv3Word(entry, read) {
    return compile(entry).parts.map(p => {
        if (p.literal !== undefined) return p.literal;
        if (p.menu) return read.menu(p.slot, p.menu.field);
        if (p.field) {
            const stored = read.field(p.slot);
            return p.toWord.get(stored) || String(stored).toLowerCase();
        }
        return read.value(p.slot);
    }).join(' ');
}
