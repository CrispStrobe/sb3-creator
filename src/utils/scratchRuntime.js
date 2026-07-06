// Single source of truth for the "scratch runtime" shim used by the Python/JavaScript
// code generators (blocks -> code) and the reverse parsers (code -> pseudocode).
//
// The algorithmic subset (variables, math, loops, lists) maps to plain Python/JS.
// Everything Scratch-specific (motion, looks, sensing, sound, pen, clones, broadcasts)
// used to be dropped to `# comments` / `None` / `False`, which made round-tripping code
// back to blocks destroy the project (sprites merged, costumes gone, collisions dead).
//
// Instead we emit those blocks as calls into a `scratch` runtime object —
// `scratch.go_to(px, py)`, `scratch.touching("Apple")` — exactly mirroring the pluggable
// hardware-driver convention. The calls are real (a shim makes the code runnable) and,
// crucially, reversible: this table drives both the generator and the parser, so every
// hop (pseudocode -> blocks -> js -> blocks -> python -> ...) preserves the project.
//
// Sprite/costume structure is carried by `scratch.sprite(...)` / `scratch.costume(...)`
// marker calls and `s<idx>_` prefixes on generated function names (see naming helpers).

// Strip a JSON string literal ("hero") back to its raw value (hero). Non-literals pass
// through unchanged (e.g. a dynamic costume expression).
export function unq (s) {
    if (typeof s !== 'string') return s;
    const t = s.trim();
    if (t.length >= 2 && t[0] === '"' && t[t.length - 1] === '"') {
        try { return JSON.parse(t); } catch { /* fall through */ }
    }
    return t;
}

function lower (s) { return String(s).toLowerCase(); }
function dprop (p) { return p === 'costume #' ? 'costume number' : p === 'backdrop #' ? 'backdrop number' : p; }

// Each entry: method name (same in Python and JS), the Scratch opcode it represents, its
// kind, how the generator builds its args, and how the parser rebuilds the pseudocode.
//   gen specs: {v:KEY} value input | {m:KEY} menu shadow | {f:KEY} field | {bc:KEY} broadcast
//   ps(a, u): a = arg strings (already pseudocode); u = unq helper for menu/field literals
const ENTRIES = [
    // ---- motion (commands) ----
    { m: 'move', op: 'motion_movesteps', gen: [{ v: 'STEPS' }], ps: (a) => `move ${a[0]} steps` },
    { m: 'turn_right', op: 'motion_turnright', gen: [{ v: 'DEGREES' }], ps: (a) => `turn right ${a[0]} degrees` },
    { m: 'turn_left', op: 'motion_turnleft', gen: [{ v: 'DEGREES' }], ps: (a) => `turn left ${a[0]} degrees` },
    { m: 'go_to_xy', op: 'motion_gotoxy', gen: [{ v: 'X' }, { v: 'Y' }], ps: (a) => `go to x: ${a[0]} y: ${a[1]}` },
    { m: 'glide_to_xy', op: 'motion_glidesecstoxy', gen: [{ v: 'SECS' }, { v: 'X' }, { v: 'Y' }], ps: (a) => `glide ${a[0]} secs to x: ${a[1]} y: ${a[2]}` },
    { m: 'change_x', op: 'motion_changexby', gen: [{ v: 'DX' }], ps: (a) => `change x by ${a[0]}` },
    { m: 'change_y', op: 'motion_changeyby', gen: [{ v: 'DY' }], ps: (a) => `change y by ${a[0]}` },
    { m: 'set_x', op: 'motion_setx', gen: [{ v: 'X' }], ps: (a) => `set x to ${a[0]}` },
    { m: 'set_y', op: 'motion_sety', gen: [{ v: 'Y' }], ps: (a) => `set y to ${a[0]}` },
    { m: 'point_in_direction', op: 'motion_pointindirection', gen: [{ v: 'DIRECTION' }], ps: (a) => `point in direction ${a[0]}` },
    // ---- motion (reporters) ----
    { m: 'x_position', op: 'motion_xposition', kind: 'reporter', gen: [], ps: () => 'x position' },
    { m: 'y_position', op: 'motion_yposition', kind: 'reporter', gen: [], ps: () => 'y position' },
    { m: 'direction', op: 'motion_direction', kind: 'reporter', gen: [], ps: () => 'direction' },
    // ---- looks (commands) ----
    { m: 'say', op: 'looks_say', gen: [{ v: 'MESSAGE' }], ps: (a) => `say ${a[0]}` },
    { m: 'say', op: 'looks_sayforsecs', gen: [{ v: 'MESSAGE' }, { v: 'SECS' }], ps: (a) => `say ${a[0]} for ${a[1]} seconds` },
    { m: 'think', op: 'looks_think', gen: [{ v: 'MESSAGE' }], ps: (a) => `think ${a[0]}` },
    { m: 'think', op: 'looks_thinkforsecs', gen: [{ v: 'MESSAGE' }, { v: 'SECS' }], ps: (a) => `think ${a[0]} for ${a[1]} seconds` },
    { m: 'show', op: 'looks_show', gen: [], ps: () => 'show' },
    { m: 'hide', op: 'looks_hide', gen: [], ps: () => 'hide' },
    { m: 'switch_costume', op: 'looks_switchcostumeto', gen: [{ m: 'COSTUME' }], ps: (a, u) => `switch costume to ${u(a[0])}` },
    { m: 'next_costume', op: 'looks_nextcostume', gen: [], ps: () => 'next costume' },
    { m: 'set_size', op: 'looks_setsizeto', gen: [{ v: 'SIZE' }], ps: (a) => `set size to ${a[0]}` },
    { m: 'change_size', op: 'looks_changesizeby', gen: [{ v: 'CHANGE' }], ps: (a) => `change size by ${a[0]}` },
    { m: 'set_effect', op: 'looks_seteffectto', gen: [{ f: 'EFFECT' }, { v: 'VALUE' }], ps: (a, u) => `set ${lower(u(a[0]))} effect to ${a[1]}` },
    { m: 'change_effect', op: 'looks_changeeffectby', gen: [{ f: 'EFFECT' }, { v: 'CHANGE' }], ps: (a, u) => `change ${lower(u(a[0]))} effect by ${a[1]}` },
    // ---- pen ----
    { m: 'pen_clear', op: 'pen_clear', gen: [], ps: () => 'clear' },
    { m: 'stamp', op: 'pen_stamp', gen: [], ps: () => 'stamp' },
    { m: 'pen_down', op: 'pen_penDown', gen: [], ps: () => 'pen down' },
    { m: 'pen_up', op: 'pen_penUp', gen: [], ps: () => 'pen up' },
    { m: 'set_pen_color', op: 'pen_setPenColorToColor', gen: [{ v: 'COLOR' }], ps: (a, u) => `set pen color to ${u(a[0])}` },
    { m: 'set_pen_size', op: 'pen_setPenSizeTo', gen: [{ v: 'SIZE' }], ps: (a) => `set pen size to ${a[0]}` },
    { m: 'change_pen_size', op: 'pen_changePenSizeBy', gen: [{ v: 'SIZE' }], ps: (a) => `change pen size by ${a[0]}` },
    { m: 'change_pen_param', op: 'pen_changePenColorParamBy', gen: [{ m: 'COLOR_PARAM', field: 'colorParam' }, { v: 'VALUE' }], ps: (a, u) => `change pen ${u(a[0])} by ${a[1]}` },
    { m: 'set_pen_param', op: 'pen_setPenColorParamTo', gen: [{ m: 'COLOR_PARAM', field: 'colorParam' }, { v: 'VALUE' }], ps: (a, u) => `set pen ${u(a[0])} to ${a[1]}` },
    // ---- sound ----
    { m: 'play_sound', op: 'sound_play', gen: [{ v: 'SOUND_MENU' }], ps: (a) => `play sound ${a[0]}` },
    { m: 'play_sound_until_done', op: 'sound_playuntildone', gen: [{ v: 'SOUND_MENU' }], ps: (a) => `play sound ${a[0]} until done` },
    { m: 'stop_sounds', op: 'sound_stopallsounds', gen: [], ps: () => 'stop all sounds' },
    { m: 'set_volume', op: 'sound_setvolumeto', gen: [{ v: 'VOLUME' }], ps: (a) => `set volume to ${a[0]}` },
    { m: 'change_volume', op: 'sound_changevolumeby', gen: [{ v: 'VOLUME' }], ps: (a) => `change volume by ${a[0]}` },
    // ---- sensing (commands + reporters) ----
    { m: 'reset_timer', op: 'sensing_resettimer', gen: [], ps: () => 'reset timer' },
    { m: 'mouse_x', op: 'sensing_mousex', kind: 'reporter', gen: [], ps: () => 'mouse x' },
    { m: 'mouse_y', op: 'sensing_mousey', kind: 'reporter', gen: [], ps: () => 'mouse y' },
    { m: 'timer', op: 'sensing_timer', kind: 'reporter', gen: [], ps: () => 'timer' },
    { m: 'loudness', op: 'sensing_loudness', kind: 'reporter', gen: [], ps: () => 'loudness' },
    { m: 'distance_to', op: 'sensing_distanceto', kind: 'reporter', gen: [{ m: 'DISTANCETOMENU' }], ps: (a, u) => `distance to ${u(a[0])}` },
    { m: 'property_of', op: 'sensing_of', kind: 'reporter', gen: [{ f: 'PROPERTY' }, { m: 'OBJECT' }], ps: (a, u) => `${dprop(u(a[0]))} of ${u(a[1])}` },
    // ---- sensing (booleans) ----
    { m: 'touching', op: 'sensing_touchingobject', kind: 'boolean', gen: [{ m: 'TOUCHINGOBJECTMENU' }], ps: (a, u) => `touching ${u(a[0])}` },
    { m: 'touching_color', op: 'sensing_touchingcolor', kind: 'boolean', gen: [{ v: 'COLOR' }], ps: (a, u) => `touching color ${u(a[0])}` },
    { m: 'key_pressed', op: 'sensing_keypressed', kind: 'boolean', gen: [{ m: 'KEY_OPTION' }], ps: (a, u) => `key ${u(a[0])} pressed?` },
    { m: 'mouse_down', op: 'sensing_mousedown', kind: 'boolean', gen: [], ps: () => 'mouse down?' },
    // ---- control ----
    // wait / wait_until are emitted explicitly by the generators (op:null — not opcode-driven),
    // but need reverse entries so `scratch.wait(x)` / `scratch.wait_until(c)` map back.
    { m: 'wait', op: null, gen: [{ v: 'DURATION' }], ps: (a) => `wait ${a[0]} seconds` },
    { m: 'wait_until', op: null, gen: [{ v: 'COND' }], ps: (a) => `wait until ${a[0]}` },
    // stop: 'this script' stays a plain return in codegen; 'all' / 'other scripts in
    // sprite' come through here so the option round-trips (field value == pseudocode tail).
    { m: 'stop', op: 'control_stop', gen: [{ f: 'STOP_OPTION' }], ps: (a, u) => `stop ${u(a[0])}` },
    { m: 'create_clone', op: 'control_create_clone_of', gen: [{ m: 'CLONE_OPTION' }], ps: (a, u) => `create clone of ${u(a[0])}` },
    { m: 'delete_clone', op: 'control_delete_this_clone', gen: [], ps: () => 'delete this clone' },
    // ---- data (monitor visibility) ----
    { m: 'show_variable', op: 'data_showvariable', gen: [{ f: 'VARIABLE' }], ps: (a, u) => `show variable ${u(a[0])}` },
    { m: 'hide_variable', op: 'data_hidevariable', gen: [{ f: 'VARIABLE' }], ps: (a, u) => `hide variable ${u(a[0])}` },
    { m: 'show_list', op: 'data_showlist', gen: [{ f: 'LIST' }], ps: (a, u) => `show list ${u(a[0])}` },
    { m: 'hide_list', op: 'data_hidelist', gen: [{ f: 'LIST' }], ps: (a, u) => `hide list ${u(a[0])}` },
    // ---- events (broadcasts) ----
    { m: 'broadcast', op: 'event_broadcast', gen: [{ bc: 'BROADCAST_INPUT' }], ps: (a) => `broadcast ${a[0]}` },
    { m: 'broadcast_and_wait', op: 'event_broadcastandwait', gen: [{ bc: 'BROADCAST_INPUT' }], ps: (a) => `broadcast ${a[0]} and wait` }
];

// ---- Arrays & Vectors extension (id `arrays`) ------------------------------------
// Same reversible-call convention, but on the `_arrays` registry object instead of
// `scratch`. Array NAME args arrive already quoted (v('NAME')), so pseudocode keeps the
// quotes exactly as decompile emits them (`new array "v"`). 0-based indices, verbatim.
const ARRAY_ENTRIES = [
    // commands
    { m: 'create1d', op: 'arrays_create1D', gen: [{ v: 'NAME' }, { v: 'JSON' }], ps: (a, u) => `new array ${a[0]} = ${u(a[1])}` },
    { m: 'create', op: 'arrays_createEmpty', gen: [{ v: 'NAME' }], ps: (a) => `new array ${a[0]}` },
    { m: 'create_range', op: 'arrays_createRange', gen: [{ v: 'NAME' }, { v: 'START' }, { v: 'END' }], ps: (a) => `new array ${a[0]} = range ${a[1]} to ${a[2]}` },
    { m: 'set', op: 'arrays_set', gen: [{ v: 'NAME' }, { v: 'INDEX' }, { v: 'VALUE' }], ps: (a) => `set item ${a[1]} of array ${a[0]} to ${a[2]}` },
    { m: 'push', op: 'arrays_push', gen: [{ v: 'NAME' }, { v: 'VALUE' }], ps: (a) => `push ${a[1]} to array ${a[0]}` },
    { m: 'insert', op: 'arrays_insert', gen: [{ v: 'NAME' }, { v: 'INDEX' }, { v: 'VALUE' }], ps: (a) => `insert ${a[2]} at ${a[1]} of array ${a[0]}` },
    { m: 'remove', op: 'arrays_remove', gen: [{ v: 'NAME' }, { v: 'INDEX' }], ps: (a) => `remove item ${a[1]} of array ${a[0]}` },
    { m: 'drop', op: 'arrays_delete', gen: [{ v: 'NAME' }], ps: (a) => `delete array ${a[0]}` },
    // reporters
    { m: 'get', op: 'arrays_get', kind: 'reporter', gen: [{ v: 'NAME' }, { v: 'INDEX' }], ps: (a) => `item ${a[1]} of array ${a[0]}` },
    { m: 'pop', op: 'arrays_pop', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `pop from array ${a[0]}` },
    { m: 'length', op: 'arrays_length', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `length of array ${a[0]}` },
    { m: 'sum', op: 'arrays_sum', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `sum of array ${a[0]}` },
    { m: 'mean', op: 'arrays_mean', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `mean of array ${a[0]}` },
    { m: 'min', op: 'arrays_min', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `smallest of array ${a[0]}` },
    { m: 'max', op: 'arrays_max', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `largest of array ${a[0]}` },
    { m: 'index_of', op: 'arrays_indexOf', kind: 'reporter', gen: [{ v: 'NAME' }, { v: 'VALUE' }], ps: (a) => `index of ${a[1]} in array ${a[0]}` },
    { m: 'reverse', op: 'arrays_reverse', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `reverse of array ${a[0]}` },
    { m: 'flatten', op: 'arrays_flatten', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `flatten of array ${a[0]}` },
    { m: 'sort', op: 'arrays_sort', kind: 'reporter', gen: [{ v: 'NAME' }, { f: 'ORDER' }], ps: (a, u) => `sort of array ${a[0]} ${u(a[1]) || 'ascending'}` },
    { m: 'slice', op: 'arrays_slice', kind: 'reporter', gen: [{ v: 'NAME' }, { v: 'START' }, { v: 'END' }], ps: (a) => `slice of array ${a[0]} from ${a[1]} to ${a[2]}` },
    { m: 'to_text', op: 'arrays_toJSON', kind: 'reporter', gen: [{ v: 'NAME' }], ps: (a) => `array ${a[0]} as text` },
    // boolean
    { m: 'contains', op: 'arrays_contains', kind: 'boolean', gen: [{ v: 'NAME' }, { v: 'VALUE' }], ps: (a) => `array ${a[0]} contains ${a[1]}` }
];

export const OP_TO_ARRAYS = {};
for (const e of ARRAY_ENTRIES) OP_TO_ARRAYS[e.op] = e;
OP_TO_ARRAYS.arrays_toString = OP_TO_ARRAYS.arrays_toJSON;   // both decompile to `array N as text`
const ARRAY_METHODS = {};
for (const e of ARRAY_ENTRIES) (ARRAY_METHODS[e.m] || (ARRAY_METHODS[e.m] = [])).push(e);

export function arraysCallToPseudo (method, args) {
    const cands = ARRAY_METHODS[method];
    if (!cands) return null;
    const e = cands.find((c) => c.gen.length === args.length) || cands[0];
    return { text: e.ps(args, unq), kind: e.kind || 'command' };
}

// opcode -> entry (generator lookup); entries with op:null are reverse-only.
export const OP_TO_SCRATCH = {};
for (const e of ENTRIES) if (e.op) OP_TO_SCRATCH[e.op] = e;

// method -> [entries] keyed by arg count (parser lookup; say/think overload by arity).
export const SCRATCH_METHODS = {};
for (const e of ENTRIES) (SCRATCH_METHODS[e.m] || (SCRATCH_METHODS[e.m] = [])).push(e);

// Rebuild the pseudocode for a `scratch.<method>(args)` call, or null if unknown.
// `args` are already-translated pseudocode strings.
export function scratchCallToPseudo (method, args) {
    const cands = SCRATCH_METHODS[method];
    if (!cands) return null;
    const e = cands.find((c) => c.gen.length === args.length) || cands.find((c) => c.gen.length <= args.length) || cands[0];
    return { text: e.ps(args, unq), kind: e.kind || 'command' };
}

// ---- generated-function naming (sprite disambiguation) ----------------------
// Generated hat/def function names are prefixed `s<idx>_` so every sprite's flag hat is a
// distinct Python/JS function. The parser strips the prefix (and any pyName `_N` dedup
// suffix) to recover the semantic name.
export function spritePrefix (idx) { return `s${idx}_`; }
export function stripSpritePrefix (name) { return String(name).replace(/^s\d+_/, ''); }

// Sanitize an arbitrary Scratch name (which may contain spaces/punctuation) into a valid
// Python/JS identifier. Single source of truth shared by the generator (SB3Creator.pyName)
// and the parser (to rebuild the original name via a rename map). No dedup here — callers
// that need uniqueness add it (pyName) or avoid collisions structurally (sprite prefixes).
const RESERVED = new Set(['for', 'while', 'if', 'else', 'elif', 'and', 'or', 'not', 'in', 'is', 'def', 'return',
    'True', 'False', 'None', 'import', 'class', 'lambda', 'global', 'pass', 'break', 'continue', 'answer',
    'function', 'var', 'let', 'const', 'null', 'undefined', 'new', 'delete', 'typeof', 'void', 'this',
    'super', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'throw', 'yield', 'await', 'async', 'do']);
export function sanitizeIdent (name) {
    let id = String(name).trim().replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'v';
    if (/^[0-9]/.test(id)) id = 'v_' + id;
    if (RESERVED.has(id)) id += '_';
    return id;
}
