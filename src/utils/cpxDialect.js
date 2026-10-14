/**
 * The BrickWright pseudocode <-> Adafruit Circuit Playground Express block map.
 *
 * `DEVICE CPX` programs are written in these words, and each word is one block
 * of the `circuitplayground` extension (CrispStrobe/extensions): the board's
 * own NeoPixel ring, buttons, slide switch, touch pads, motion, light,
 * temperature and sound sensors, and speaker, with pxt-adafruit 1.6.8's
 * behaviour. The table is the whole contract: sb3Creator.js parses a line
 * against it and decompiles a block through it, so a word cannot be readable
 * in one direction and not the other.
 *
 * An entry has the shape of an arcadeDialect.js entry and is compiled and
 * spelled by that file's grammar (compileArcadeWord / spellArcadeWord):
 *
 *   {NAME}                 a value input
 *   {NAME:a|b|c}           a field; the word IS the stored value
 *   {NAME:menu:m:a|b}      a reporter input with the extension's native menu
 *                          shadow `circuitplayground_menu_m`; a bare choice or
 *                          a value expression
 *
 * Field values are one token each, and they are MakeCode's own identifiers
 * (Gesture.TiltLeft is `tiltLeft`, Sounds.PowerUp `powerUp`), the values the
 * extension's menus store — so a word spells exactly what the block holds,
 * and an imported MakeCode program needs no renaming.
 *
 * WHERE THE WORDS APPLY. Commands and hats are read only under `DEVICE CPX`
 * and before any generic rule, as DEVICE EV3's are. Reporters and booleans
 * begin with `cpx`, which keeps them from ever reading as a variable. A
 * command that would otherwise shadow the Scratch stage's sound blocks says
 * `board` (`play board sound`, `stop all board sounds`, `set board volume`),
 * the same choice DEVICE EV3 made with `brick`: those words keep meaning the
 * stage on DEVICE CPX.
 *
 * THE SLICE IS COUNTED, not implied: every opcode of the pinned extension
 * surface (runtimeRegistry.generated.js `circuitplayground`) is a word here,
 * and test/cpx-dialect.test.mjs requires the two sets to be equal.
 */
export const CPX_EXTENSION = 'circuitplayground';

const COLORS = 'red|orange|yellow|green|blue|indigo|violet|purple|pink|white|black';
const COLOR_MENU = `menu:colors:${COLORS}`;
const ANIMATIONS = 'rainbow|runningLights|comet|sparkle|theaterChase|colorWipe';
const BUTTONS = 'A|B|A+B';
const PADS = 'A1|A2|A3|A4|A5|A6|A7';
const BUTTON_EVENTS = 'click|longClick|up|down';
const GESTURES = 'shake|tiltUp|tiltDown|tiltLeft|tiltRight|faceUp|faceDown|freeFall|twoG|threeG|sixG|eightG';
const SOUNDS = 'powerUp|powerDown|jumpUp|jumpDown|baDing|wawawawaa|magicWand|siren|pewPew';
const NOTES = 'C|CSharp|D|Eb|E|F|FSharp|G|GSharp|A|Bb|B|'
    + 'C3|CSharp3|D3|Eb3|E3|F3|FSharp3|G3|GSharp3|A3|Bb3|B3|'
    + 'C4|CSharp4|D4|Eb4|E4|F4|FSharp4|G4|GSharp4|A4|Bb4|B4|'
    + 'C5|CSharp5|D5|Eb5|E5|F5|FSharp5|G5|GSharp5|A5|Bb5|B5';
const BEATS = 'whole|half|quarter|eighth|sixteenth|double|breve';

const w = (op, kind, words) => Object.freeze({ op: `${CPX_EXTENSION}_${op}`, kind, words, menuExtension: CPX_EXTENSION });

export const CPX_WORDS = Object.freeze([
    // ---- the NeoPixel ring --------------------------------------------------
    w('setall', 'command', `set all pixels to {COLOR:${COLOR_MENU}}`),
    // Before `set pixel {INDEX} to`: table order is precedence, and that word's
    // INDEX slot would otherwise read `brightness` as a pixel number.
    w('setbrightness', 'command', 'set pixel brightness to {BRIGHTNESS}'),
    w('setpixel', 'command', `set pixel {INDEX} to {COLOR:${COLOR_MENU}}`),
    w('setgradient', 'command', `set gradient from {START:${COLOR_MENU}} to {END:${COLOR_MENU}}`),
    w('graph', 'command', 'graph {VALUE} up to {HIGH}'),
    w('showring', 'command', 'show ring {COLORS}'),
    w('clearpixels', 'command', 'clear pixels'),
    w('showanimation', 'command', `show animation {ANIMATION:${ANIMATIONS}} for {MS} ms`),
    w('showanimationframe', 'command', `show frame of animation {ANIMATION:${ANIMATIONS}}`),
    w('stopanimations', 'command', 'stop all animations'),
    w('pixelcolor', 'reporter', 'cpx pixel color at {INDEX}'),
    w('rgb', 'reporter', 'cpx red {R} green {G} blue {B}'),
    w('hsv', 'reporter', 'cpx hue {H} sat {S} val {V}'),
    w('color', 'reporter', `cpx color {COLOR:${COLORS}}`),
    w('fade', 'reporter', `cpx fade {COLOR:${COLOR_MENU}} by {BRIGHTNESS}`),
    // ---- buttons, switch, touch -------------------------------------------
    w('whenbutton', 'hat', `when button {BUTTON:${BUTTONS}} {EVENT:${BUTTON_EVENTS}}`),
    w('isbuttonpressed', 'boolean', `cpx button {BUTTON:${BUTTONS}} is pressed`),
    w('wasbuttonpressed', 'boolean', `cpx button {BUTTON:${BUTTONS}} was pressed`),
    w('whenswitch', 'hat', 'when switch moved {DIRECTION:left|right}'),
    w('isswitchright', 'boolean', 'cpx switch right'),
    w('whentouch', 'hat', `when touch {PAD:${PADS}} {EVENT:${BUTTON_EVENTS}}`),
    w('istouchpressed', 'boolean', `cpx touch {PAD:${PADS}} is pressed`),
    // ---- motion and sensors -------------------------------------------------
    w('whengesture', 'hat', `when gesture {GESTURE:${GESTURES}}`),
    w('acceleration', 'reporter', 'cpx acceleration {DIMENSION:x|y|z|strength}'),
    w('rotation', 'reporter', 'cpx rotation {KIND:pitch|roll}'),
    w('lightlevel', 'reporter', 'cpx light level'),
    w('whenlight', 'hat', 'when light {CONDITION:dark|bright}'),
    w('setlightthreshold', 'command', 'set {CONDITION:dark|bright} light threshold to {VALUE}'),
    w('temperature', 'reporter', 'cpx temperature in {UNIT:C|F}'),
    w('whentemperature', 'hat', 'when temperature {CONDITION:hot|cold} at {TEMPERATURE} {UNIT:C|F}'),
    w('soundlevel', 'reporter', 'cpx sound level'),
    w('whenloudsound', 'hat', 'when loud sound'),
    w('setloudthreshold', 'command', 'set loud sound threshold to {VALUE}'),
    // ---- the speaker ---------------------------------------------------------
    w('playtone', 'command', 'play tone {FREQUENCY} Hz for {MS} ms'),
    w('ringtone', 'command', 'ring tone {FREQUENCY} Hz'),
    w('rest', 'command', 'rest for {MS} ms'),
    w('note', 'reporter', `cpx note {NOTE:${NOTES}}`),
    w('beat', 'reporter', `cpx {FRACTION:${BEATS}} beat`),
    w('tempo', 'reporter', 'cpx tempo'),
    w('settempo', 'command', 'set tempo to {BPM} bpm'),
    w('changetempo', 'command', 'change tempo by {BPM} bpm'),
    w('playsound', 'command', `play board sound {SOUND:${SOUNDS}}`),
    w('playsounduntildone', 'command', `play board sound {SOUND:${SOUNDS}} until done`),
    w('stopsounds', 'command', 'stop all board sounds'),
    w('setvolume', 'command', 'set board volume to {VOLUME}')
]);

const byOpcode = new Map(CPX_WORDS.map((e) => [e.op, e]));

/** The table entry for a `circuitplayground_*` opcode, or null. */
export function cpxWordFor(opcode) {
    return byOpcode.get(opcode) || null;
}

/** The entries of the given kinds, in table order (the order is the precedence). */
export function cpxWordsOf(kinds) {
    return CPX_WORDS.filter((e) => kinds.includes(e.kind));
}

/** The extension ops the table covers (without the extension prefix). */
export const CPX_DIALECT_OPS = Object.freeze(CPX_WORDS.map((e) => e.op.slice(CPX_EXTENSION.length + 1)));
