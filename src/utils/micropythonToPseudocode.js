// micropythonToPseudocode — read a micro:bit or Pico program back into the dialect.
//
// The fourth reader, and the one whose two dialects share the least. A micro:bit
// program says `pin0.write_digital(1)`; a Pico says `_pin15.value(1)`, having
// first declared `_pin15 = Pin(15, Pin.OUT)`. Nothing about those is the same
// call, and the boards do not even agree on whether a pin is declared at all.
// So the vocabulary is chosen by the import line and the two are kept apart,
// exactly as cToPseudocode.js keeps 8051 and Arduino apart.
//
// What makes this tractable is that the emitter leaves its own evidence behind,
// and this reader is built to collect it rather than to guess:
//
//   pin0.write_digital(0)  # led off      <- the NAME, and the polarity
//   _level = {'led': 0}                   <- the names again, on the micro:bit
//   _pin15 = Pin(15, Pin.OUT)             <- the direction, on the Pico
//
// The parking line at the end of a generated program is the richest of these.
// It exists so a board starts with its loads off, and in doing so it records
// what the pin was called and which level means "off" — which is precisely the
// ACTIVE LOW that no amount of reading the loop body would recover.
//
// Hand-written MicroPython gets what it gives. A pin nobody named comes back as
// p0/gp15, and a call this does not know stays visible as a warning rather than
// disappearing into a translation that looks complete.

const MICROBIT_IMPORT = /^\s*from\s+microbit\s+import\s+\*/m;
const MACHINE_IMPORT = /^\s*from\s+machine\s+import\b/m;

/** Strip `#` comments, but hand back the ones that name a pin. */
function splitComment (line) {
    let inS = null;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inS) { if (c === '\\') i++; else if (c === inS) inS = null; continue; }
        if (c === '"' || c === "'") { inS = c; continue; }
        if (c === '#') return [line.slice(0, i), line.slice(i + 1).trim()];
    }
    return [line, null];
}

/** Lift the emitter's `_eq(a, b)` loose-equality helper back to `(a = b)`,
 *  recursively and with balanced parentheses so nested and readPin arguments
 *  survive. Left in place it reads back as an unknown call. */
function liftEq (str) {
    let out = '', i = 0;
    while (i < str.length) {
        if (str.startsWith('_eq(', i)) {
            let d = 0, comma = -1, j = i + 3;
            for (; j < str.length; j++) {
                const c = str[j];
                if (c === '(') d++;
                else if (c === ')') { d--; if (d === 0) break; }
                else if (c === ',' && d === 1 && comma === -1) comma = j;
            }
            if (comma !== -1 && j < str.length) {
                out += `(${liftEq(str.slice(i + 4, comma)).trim()} = ${liftEq(str.slice(comma + 1, j)).trim()})`;
                i = j + 1;
                continue;
            }
        }
        out += str[i++];
    }
    return out;
}

/** Unwrap the emitter's `_truthy(X)` boolean-coercion helper: in a condition
 *  the coercion is implicit, so `_truthy(X)` reads back as just `X`. Balanced,
 *  recursive, like liftEq. */
function liftTruthy (str) {
    let out = '', i = 0;
    while (i < str.length) {
        if (str.startsWith('_truthy(', i)) {
            let d = 0, j = i + 7;
            for (; j < str.length; j++) {
                if (str[j] === '(') d++;
                else if (str[j] === ')') { d--; if (d === 0) break; }
            }
            if (j < str.length) { out += liftTruthy(str.slice(i + 8, j)).trim(); i = j + 1; continue; }
        }
        out += str[i++];
    }
    return out;
}

export default function micropythonToPseudocode (source, opts = {}) {
    const warnings = [];
    const warn = (m) => { if (!warnings.includes(m)) warnings.push(m); };

    const isMicrobit = MICROBIT_IMPORT.test(source);
    const isPico = !isMicrobit && MACHINE_IMPORT.test(source);
    if (!isMicrobit && !isPico) {
        return {
            pseudocode: '',
            warnings: ['not MicroPython for a board this reads: expected '
                + '`from microbit import *` or `from machine import ...`']
        };
    }
    // Both boards run the same interpreter, so CLOCK is not a thing either of
    // them has. It is emitted because the dialect wants one, and 16 MHz is what
    // the writer uses -- keeping the pair consistent matters more than the
    // number, which nothing reads.
    let device = opts.device || (isMicrobit ? 'microbit' : 'pico');

    const rawLines = source.split('\n');
    const lines = rawLines.map((l) => {
        const [code, comment] = splitComment(l);
        return { code: code.replace(/\s+$/, ''), comment, indent: code.search(/\S/) };
    });

    // ---- pins -------------------------------------------------------------
    // where -> {name, where, direction, activeLow, obj}
    const pins = new Map();
    const byObj = new Map();
    const consumedDicts = new Set();   // keypad-idiom dicts already read as pins
    const put = (obj, where, direction, activeLow, name) => {
        const prev = pins.get(where);
        if (prev) {
            if (direction && RANK[direction] > RANK[prev.direction]) prev.direction = direction;
            if (activeLow) prev.activeLow = true;
            if (name) prev.name = name;
            byObj.set(obj, prev);
            return prev;
        }
        // The writer's own evidence, again: the sb3-creator Pico emitter
        // names its objects _pin_<dialect-name>, so 'b9' survives the
        // round trip instead of degrading to 'gp2'.
        const fromObj = /^_pin_(\w+)$/.exec(obj || '');
        const rec = { name: name || (fromObj && fromObj[1]) || where.toLowerCase(),
            where, direction: direction || 'output',
            activeLow: !!activeLow, obj };
        pins.set(where, rec);
        byObj.set(obj, rec);
        return rec;
    };
    const RANK = { analog: 5, tone: 4, pwm: 3, output: 2, input: 1 };

    const text = lines.map((l) => l.code).join('\n');

    if (isMicrobit) {
        // `pin0`, `pin1`, … and the two buttons. No declaration exists, so the
        // calls are the only evidence, exactly as on an Arduino.
        for (const [re, dir] of [[/\bpin(\d+)\.write_digital\s*\(/g, 'output'],
                                 [/\bpin(\d+)\.read_digital\s*\(/g, 'input'],
                                 [/\bpin(\d+)\.read_analog\s*\(/g, 'analog'],
                                 [/\bpin(\d+)\.write_analog\s*\(/g, 'pwm']]) {
            for (const m of text.matchAll(re)) put(`pin${m[1]}`, `P${m[1]}`, dir, false, null);
        }
        for (const m of text.matchAll(/\bmusic\.pitch\s*\([^)]*?pin\s*=\s*pin(\d+)/g)) {
            put(`pin${m[1]}`, `P${m[1]}`, 'tone', false, null);
        }
        for (const m of text.matchAll(/\bbutton_([ab])\.is_pressed\s*\(/g)) {
            const b = `BUTTON_${m[1].toUpperCase()}`;
            put(`button_${m[1]}`, b, 'input', false, null);
        }
    } else {
        // The Pico declares its pins, which is more than the micro:bit or an
        // Arduino ever does. PULL_UP is a button to ground: pressed reads 0,
        // so the input is ACTIVE LOW and the source said so.
        for (const m of text.matchAll(/\b(\w+)\s*=\s*Pin\s*\(\s*(\d+)\s*,\s*Pin\.OUT/g)) {
            put(m[1], `GP${m[2]}`, 'output', false, null);
        }
        for (const m of text.matchAll(/\b(\w+)\s*=\s*Pin\s*\(\s*(\d+)\s*,\s*Pin\.IN(?:\s*,\s*Pin\.(PULL_UP|PULL_DOWN))?/g)) {
            put(m[1], `GP${m[2]}`, 'input', m[3] === 'PULL_UP', null);
        }
        // The hardware I2C constructor IS a pin declaration: sda/scl by
        // keyword, the bus by pin — the dialect's sda/scl OUTPUT pair.
        for (const m of text.matchAll(/I2C\s*\(\s*\d+\s*,\s*sda\s*=\s*Pin\s*\(\s*(\d+)\s*\)\s*,\s*scl\s*=\s*Pin\s*\(\s*(\d+)\s*\)/g)) {
            put('_i2c_sda', `GP${m[1]}`, 'output', false, 'sda');
            put('_i2c_scl', `GP${m[2]}`, 'output', false, 'scl');
        }
        // The KEYPAD IDIOM of hand-written Pico code (the owner's
        // calculator): a gpio->label dict plus one comprehension that
        // constructs every Pin. Nothing here is generated evidence — it
        // is the way people actually write many-button programs, and the
        // labels name the pins better than gp<N> ever could.
        //
        //   KEYS = { 2: "9", 3: "0", ..., 16: "EXE" }
        //   pins = {gp: Pin(gp, Pin.IN, Pin.PULL_DOWN) for gp in KEYS}
        {
            const comp = /\{\s*(\w+)\s*:\s*Pin\s*\(\s*\1\s*,\s*Pin\.IN(?:\s*,\s*Pin\.(PULL_UP|PULL_DOWN))?\s*\)\s*for\s+\1\s+in\s+(\w+)\s*\}/.exec(text);
            if (comp) {
                const dictRe = new RegExp(comp[3] + '\\s*=\\s*\\{([^}]*)\\}');
                const dm = dictRe.exec(text);
                if (dm) {
                    consumedDicts.add(comp[3]);
                    const activeLow = comp[2] === 'PULL_UP';
                    for (const e of dm[1].matchAll(/(\d+)\s*:\s*"([^"]*)"/g)) {
                        const gp = e[1];
                        const label = e[2];
                        const name = /^\d$/.test(label) ? `k${label}`
                            : label === '+' ? 'kplus' : label === '-' ? 'kminus'
                            : label === '*' ? 'ktimes' : label === '/' ? 'kdiv'
                            : /^[A-Za-z_]\w*$/.test(label) ? label.toLowerCase()
                            : `gp${gp}`;
                        put(`${comp[3]}_${gp}`, `GP${gp}`, 'input', activeLow, name);
                    }
                }
            }
        }
        for (const m of text.matchAll(/\b(\w+)\s*=\s*ADC\s*\(\s*(\d+)\s*\)/g)) {
            put(m[1], `GP${m[2]}`, 'analog', false, null);
        }
        for (const m of text.matchAll(/\b(\w+)\s*=\s*PWM\s*\(\s*Pin\s*\(\s*(\d+)\s*\)\s*\)/g)) {
            put(m[1], `GP${m[2]}`, 'pwm', false, null);
        }
        // A PWM object that is only ever given a frequency is a tone, not a
        // brightness. Both are a PWM peripheral; only the dialect separates them.
        for (const m of text.matchAll(/\b(\w+)\.freq\s*\(/g)) {
            const rec = byObj.get(m[1]);
            if (rec && rec.direction === 'pwm' && !new RegExp(`\\b${m[1]}\\.duty_u16\\s*\\(\\s*\\(`).test(text)) {
                rec.direction = 'tone';
            }
        }
    }

    // An STC program driven on a non-STC board resolves its pins through the
    // `_stc12` driver, whose pin table the emitter now emits beside it:
    //   _stc12_pins = json.loads("{\"led1\": {\"pin\": \"P1.0\", \"dir\": ...}}")
    // The table carries the port/bit and polarity the board's own pins never
    // could, so the pins are declared straight from it and `read <name>`/writes
    // resolve to a declared pin instead of re-parsing as a variable.
    const stcTable = text.match(/_stc\d*_pins\s*=\s*json\.loads\(\s*("(?:[^"\\]|\\.)*")\s*\)/);
    if (stcTable) {
        let table = null;
        try { table = JSON.parse(JSON.parse(stcTable[1])); } catch { table = null; }
        if (table && typeof table === 'object') {
            for (const [name, p] of Object.entries(table)) {
                if (!p || !p.pin) continue;
                const dir = p.dir === 'analog' ? 'analog' : p.dir === 'output' ? 'output' : 'input';
                put(name, p.pin, dir, !!p.low, name);
            }
        }
    }

    // ---- the header, when the writer left one ------------------------------
    // Everything below this recovers facts from the code, which works and is
    // what a hand-written program gets. But a pin that is never parked has its
    // NAME nowhere in the program at all -- `_adc26` is what the machine needs
    // and `pot` is what the author wrote -- so the writer states it, and a
    // stated fact beats an inferred one every time.
    const block = source.match(/@bw-begin([\s\S]*?)@bw-end/);
    let markerDevice = null;
    if (block) {
        for (const line of block[1].split('\n')) {
            let m;
            if ((m = line.match(/@bw\s+device\s+(\S+)/))) { markerDevice = m[1].toLowerCase(); continue; }
            if ((m = line.match(/@bw\s+pin\s+(\w+)\s+(\S+)\s+(\w+)(\s+active-low)?/))) {
                const [, name, where, direction, low] = m;
                const rec = pins.get(where.toUpperCase());
                if (rec) {
                    rec.name = name;
                    rec.direction = direction.toLowerCase();
                    rec.activeLow = !!low;
                } else {
                    // Declared in the header and never used in the body. Still
                    // a pin the program has, and dropping it would silently
                    // shrink the board.
                    pins.set(where.toUpperCase(), { name, where: where.toUpperCase(),
                        direction: direction.toLowerCase(), activeLow: !!low, obj: null });
                }
            }
        }
    }

    // ---- names and polarity, recovered from the parking lines -------------
    // `pin0.write_digital(0)  # led off` says three things at once: that P0 is
    // called "led", that the pin is an output, and that 0 is its OFF level --
    // which is the ACTIVE LOW the loop body cannot reveal, because a program
    // that only ever turns a lamp on looks identical either way.
    for (const l of lines) {
        if (!l.comment) continue;
        const named = l.comment.match(/^(\w+)\s+off$/i);
        if (!named) continue;
        const m = l.code.match(/\b(\w+)\.(?:write_digital|value)\s*\(\s*([01])\s*\)/);
        if (!m) continue;
        const rec = byObj.get(m[1]);
        if (!rec || block) continue;    // the header already said, and said better
        rec.name = named[1];
        rec.activeLow = m[2] === '1';   // "off" is HIGH => the load is active low
    }
    // The micro:bit's toggle dictionary carries the same names, and covers a
    // pin that is toggled but never parked.
    for (const m of text.matchAll(/_level\s*\[\s*'([^']+)'\s*\]\s*=\s*1\s*-\s*_level/g)) {
        const name = m[1];
        const after = text.slice(text.indexOf(m[0]) + m[0].length, text.indexOf(m[0]) + m[0].length + 200);
        const w = after.match(/\b(pin\d+)\.write_digital/);
        if (w && byObj.get(w[1]) && /^p\d+$/i.test(byObj.get(w[1]).name)) byObj.get(w[1]).name = name;
    }

    const nameOf = (obj) => (byObj.get(obj) || {}).name;

    // ---- expressions ------------------------------------------------------
    const expr = (raw) => {
        let e = String(raw).trim();
        if (!e) return '0';
        // Pin reads, innermost first.
        e = e.replace(/\bbutton_([ab])\.is_pressed\s*\(\s*\)/g,
            (_, b) => `read ${nameOf(`button_${b}`) || `button_${b}`}`);
        e = e.replace(/\b(\w+)\.read_analog\s*\(\s*\)/g, (_, o) => `read ${nameOf(o) || o}`);
        e = e.replace(/\b(\w+)\.read_digital\s*\(\s*\)/g, (_, o) => `read ${nameOf(o) || o}`);
        // The Pico's ADC is 16-bit and the writer scales it so every board
        // reports the same 0-1023. Undo exactly that, rather than leaving an
        // arithmetic detail of one board in the portable text.
        e = e.replace(/\b(\w+)\.read_u16\s*\(\s*\)\s*>>\s*6/g, (_, o) => `read ${nameOf(o) || o}`);
        e = e.replace(/\b(\w+)\.value\s*\(\s*\)/g, (_, o) => `read ${nameOf(o) || o}`);
        // MicroPython emitted for an STC-targeted program drives the pins through
        // the `_stc*` driver shim: a pin read is `_stc12.readPin("name")`, and the
        // pin's dialect name is the string literal itself. Left unmapped it comes
        // back quoted as a string; mapped, it is the same `read <name>` reporter
        // the native boards produce.
        e = e.replace(/\b_stc\d*\.readPin\s*\(\s*"([^"]+)"\s*\)/g, (_, name) => {
            // An STC pin read. When the `_stc12_pins` table is present it was
            // already turned into a `PIN <name>` declaration above, so `read
            // <name>` binds to a real pin and round-trips. Only when the table
            // is absent (an older emit) is the port/bit unrecoverable — then the
            // read still lifts, but the loss of its declaration is named.
            if (![...pins.values()].some((p) => p.name === name)) {
                warn(`pin ${name}: read through the STC driver, but this MicroPython carries no pin table — the port/bit is not in the source, so it cannot be declared and re-parses as a variable`);
            }
            return `read ${name}`;
        });
        e = liftEq(e);
        e = liftTruthy(e);
        e = e.replace(/\btime\.ticks_ms\s*\(\s*\)|\brunning_time\s*\(\s*\)/g, 'timer');
        e = e.replace(/\bnot\s+/g, 'not ');
        e = e.replace(/\bTrue\b/g, '1').replace(/\bFalse\b/g, '0');
        e = e.replace(/\/\//g, '/');
        // A fully-parenthesised sub-expression is the writer's habit, not the
        // author's; unwrapping the outermost pair keeps the text readable.
        while (/^\((.*)\)$/.test(e)) {
            const inner = e.slice(1, -1);
            let d = 0, ok = true;
            for (const c of inner) { if (c === '(') d++; else if (c === ')') { d--; if (d < 0) { ok = false; break; } } }
            if (!ok || d !== 0) break;
            e = inner.trim();
        }
        return e;
    };

    // ---- statements -------------------------------------------------------
    const out = [];
    const emit = (depth, s) => out.push('  '.repeat(depth) + s);

    // `print` coerces with `str(...)`, so the emitter writes `print(str(X))`.
    // Strip ONE `str(...)` layer when it wraps the whole argument, or the wrap
    // doubles on re-emission. `str(a) + str(b)` (a join) is not wrapped whole,
    // and is left alone.
    const stripOuterStr = (a) => {
        a = a.trim();
        if (!a.startsWith('str(') || !a.endsWith(')')) return a;
        let d = 0;
        for (let k = 3; k < a.length; k++) {
            if (a[k] === '(') d++;
            else if (a[k] === ')') { d--; if (d === 0) return k === a.length - 1 ? a.slice(4, -1).trim() : a; }
        }
        return a;
    };

    // The generated program puts each script in its own task function — older
    // output named the single one `bw_script()`, current output emits one
    // `_task_N()` per script and drives them from a `_run(...)` scheduler that
    // is pure infrastructure. A hand-written program is usually just a
    // `while True:` at module level. In every case the reader lifts ONE script
    // body; the scheduler, the `_run([...])` kickoff and the `_pending`/
    // `_receivers`/`_bw_*` runtime vars are ours, and are dropped because the
    // body loop stops at the end of the task function (its dedent to column 0).
    let start = 0, bodyIndent = 0;
    const fn = lines.findIndex((l) => /^def\s+(?:bw_script|_task_0)\s*\(/.test(l.code));
    if (fn !== -1) { start = fn + 1; bodyIndent = 4; } else {
        const w = lines.findIndex((l) => /^\s*while\s+True\s*:/.test(l.code));
        if (w === -1) warn('no bw_script() and no `while True:` — nothing that looks like a script');
        start = w === -1 ? lines.length : w;
        bodyIndent = lines[start] ? lines[start].indent : 0;
    }
    // The emitter writes one `_task_N()` per script and this reader lifts the
    // first. When there is more than one, the others are the learner's scripts,
    // NOT runtime — they must not be swallowed silently. Name them, and leave
    // the program degraded for a real reason.
    const taskCount = lines.filter((l) => /^def\s+_task_\d+\s*\(/.test(l.code)).length;
    if (taskCount > 1) warn(`${taskCount - 1} more WHEN script(s) not lifted — this reader lifts one script per program`);

    // ---- module-level setup BEFORE the script: grey-block preserved ------
    // Imports of unknown modules, helper defs, setup calls — everything the
    // evidence collectors above did not consume rides along verbatim, in
    // order, at the top of the script. Known infrastructure (the machine
    // import, Pin/ADC/PWM/I2C construction, the keypad dict) is silent:
    // it IS the declarations.
    // Only HAND-WRITTEN programs get this: a generated program's preamble
    // is our own infrastructure (drivers, scheduler, pin objects) — the
    // evidence collectors mine it, and preserving it as grey blocks would
    // DUPLICATE the driver on re-emission.
    const isGenerated = fn !== -1 || /^# generated for /m.test(source);
    if (!isGenerated) {
        const knownInfra = (t) => /^from\s+(machine|microbit)\s+import\b/.test(t)
            || /^import\s+(framebuf|time|machine|utime)\s*$/.test(t)
            || /^\w+\s*=\s*(Pin|ADC|PWM|I2C)\s*\(/.test(t)
            || /^\{?\s*\w+\s*:\s*Pin\s*\(/.test(t)
            || /Pin\s*\(\s*\w+\s*,/.test(t) && /for\s+\w+\s+in\s+/.test(t)
            || /^_?[A-Z_]+\s*=\s*\d+\s*$/.test(t);   // bare numeric consts (DEBOUNCE_MS)
        let skipDict = null;
        for (let i = 0; i < start; i++) {
            const t = lines[i].code;
            const trimmed = t.trim();
            if (!trimmed) continue;
            if (skipDict) { if (/\}/.test(trimmed)) skipDict = null; continue; }
            const dictOpen = /^(\w+)\s*=\s*\{\s*$/.exec(trimmed);
            if (dictOpen && consumedDicts.has(dictOpen[1])) { skipDict = dictOpen[1]; continue; }
            const dictInline = /^(\w+)\s*=\s*\{.*\}\s*$/.exec(trimmed);
            if (dictInline && consumedDicts.has(dictInline[1])) continue;
            if (knownInfra(trimmed)) continue;
            // preserve with the ORIGINAL relative indentation inside the text,
            // so multi-line defs stay valid Python when re-emitted
            emit(1, `raw "${t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
            warn(`kept verbatim as a grey block: "${trimmed.slice(0, 60)}"`);
        }
    }

    // The body of the loop starting at line `at` (indent `ind`) is nothing but
    // the `yield 0` back-edge — i.e. the loop has no statements of its own.
    const bodyIsOnlyYield0 = (at, ind) => {
        for (let j = at + 1; j < lines.length; j++) {
            const t = lines[j];
            if (!t.code.trim()) continue;
            if (t.indent <= ind) return true;             // body ended, only yields seen
            if (!/^yield\s+0$/.test(t.code.trim())) return false;   // a real statement -> not empty
        }
        return true;
    };

    for (let i = start; i < lines.length; i++) {
        const l = lines[i];
        if (!l.code.trim()) continue;
        if (l.indent < bodyIndent && fn !== -1) break;        // out of the function
        const depth = Math.max(0, Math.floor((l.indent - bodyIndent) / 4)) + 1;
        const s = l.code.trim();
        let m;

        // A tone is one ACT written as four statements -- set the frequency,
        // guard against zero, park the duty. Consumed as a unit and BEFORE the
        // generic if/else, which would otherwise take the `if _hz:` and emit a
        // branch nobody wrote.
        if ((m = s.match(/^_hz\s*=\s*(.+)$/))) {
            const hz = expr(m[1]);
            let j = i + 1, tone = null;
            while (j < lines.length) {
                const t = lines[j].code.trim();
                if (!t) { j++; continue; }
                if (lines[j].indent <= l.indent && !/^(if\s+_hz\s*:|else\s*:)$/.test(t)) break;
                const f = t.match(/^(\w+)\.freq\s*\(/);
                if (f && byObj.get(f[1])) tone = byObj.get(f[1]);
                if (!/^(if\s+_hz\s*:|else\s*:|\w+\.freq\s*\(|\w+\.duty_u16\s*\()/.test(t)) break;
                j++;
            }
            const pin = tone || [...pins.values()].find((q) => q.direction === 'tone');
            if (pin) { emit(depth, `set ${pin.name} to ${hz} hz`); i = j - 1; continue; }
            emit(depth, `set _hz to ${hz}`); continue;
        }
        if (/^while\s+True\s*:$/.test(s)) { emit(depth, 'FOREVER:'); continue; }
        // `repeat N` is a counted loop: `for _ in range(int(N)):` with a
        // `yield 0` back-edge. Lift it back; the body reads on as usual.
        if ((m = s.match(/^for\s+_\s+in\s+range\s*\(\s*int\s*\(\s*(.+)\s*\)\s*\)\s*:$/))) {
            emit(depth, `REPEAT ${expr(m[1])}:`); continue;
        }
        if ((m = s.match(/^while\s+(.+?)\s*:$/))) {
            // `repeat until X` and `wait until X` are both emitted as
            // `while not (X):`. Lifting `while C` as `REPEAT UNTIL not (C)` is
            // right in general, but for the emitter's own `not (X)` it doubles
            // the negation; strip the pair and read the UNTIL condition straight.
            const neg = m[1].match(/^not\s*\((.+)\)$/);
            if (neg) {
                // A `while not (X):` whose ONLY body is the `yield 0` back-edge
                // is a `wait until X`, not a bodyless `repeat until`; the two
                // emit differently, so telling them apart keeps the round trip.
                if (bodyIsOnlyYield0(i, l.indent)) {
                    emit(depth, `wait until ${expr(neg[1])}`);
                    while (i + 1 < lines.length && (!lines[i + 1].code.trim() || lines[i + 1].indent > l.indent)) i++;
                    continue;
                }
                emit(depth, `REPEAT UNTIL ${expr(neg[1])}:`); continue;
            }
            emit(depth, `REPEAT UNTIL not (${expr(m[1])}):`); continue;
        }
        if ((m = s.match(/^if\s+(.+?)\s*:$/))) { emit(depth, `IF ${expr(m[1])} THEN:`); continue; }
        if ((m = s.match(/^elif\s+(.+?)\s*:$/))) { emit(depth, `ELSE IF ${expr(m[1])} THEN:`); continue; }
        if (/^else\s*:$/.test(s)) { emit(depth, 'ELSE:'); continue; }

        // Waits. Both spellings, and both boards.
        if ((m = s.match(/^(?:time\.)?sleep_ms\s*\(\s*(.+?)\s*\)$/))
            || (m = s.match(/^sleep\s*\(\s*(.+?)\s*\)$/))) {
            emit(depth, `wait ${expr(m[1])} ms`); continue;
        }
        if ((m = s.match(/^time\.sleep\s*\(\s*(.+?)\s*\)$/))) {
            emit(depth, `wait ${expr(m[1])} seconds`); continue;
        }
        if ((m = s.match(/^print\s*\(\s*(.*)\s*\)$/))) { emit(depth, `print ${expr(stripOuterStr(m[1]))}`); continue; }

        // micro:bit display verbs. A `display.scroll(...)` is one of three
        // dialect verbs told apart by its keyword args: `wait=False, loop=False`
        // is `display <value>`, `delay=int(N)` is `scroll text ... delay N ms`,
        // and a bare argument is `show text ...`. A python string literal ('x'
        // or "x") reads back as the dialect's double-quoted text; anything else
        // is an expression.
        {
            const asText = (a) => { const q = a.match(/^'([^']*)'$/) || a.match(/^"([^"]*)"$/); return q ? `"${q[1]}"` : expr(a); };
            if (/^display\.clear\s*\(\s*\)$/.test(s)) { emit(depth, 'clear display'); continue; }
            if ((m = s.match(/^display\.show\s*\(\s*Image\s*\(\s*'([^']*)'\s*\)\s*\)$/))) {
                emit(depth, `show pattern ${m[1].replace(/:/g, '')}`); continue;
            }
            if ((m = s.match(/^display\.scroll\s*\(\s*(.+?)\s*,\s*wait=False\s*,\s*loop=False\s*\)$/))) {
                emit(depth, `display ${expr(stripOuterStr(m[1]))}`); continue;
            }
            if ((m = s.match(/^display\.scroll\s*\(\s*(.+?)\s*,\s*delay=int\(\s*(.+?)\s*\)\s*\)$/))) {
                emit(depth, `scroll text ${asText(m[1])} delay ${expr(m[2])} ms`); continue;
            }
            if ((m = s.match(/^display\.scroll\s*\(\s*(.+?)\s*\)$/))) {
                emit(depth, `show text ${asText(m[1])}`); continue;
            }
        }

        // A toggle is two statements on the micro:bit; the dictionary write is
        // bookkeeping and the pin write is the act, so the pair collapses.
        if ((m = s.match(/^_level\s*\[\s*'([^']+)'\s*\]\s*=\s*1\s*-\s*_level/))) {
            const next = lines[i + 1];
            if (next && /\.write_digital\s*\(\s*_level\s*\[/.test(next.code)) {
                emit(depth, `toggle ${m[1]}`); i++; continue;
            }
        }

        // STC driver writes. When a pin is not one of the board's own, the
        // emitter routes the write through the `_stc12` driver by name; lift
        // those back to the same verbs the decompiler emits (turn on/off, set
        // <pin> high/low, set <pin> to <expr>, toggle).
        if ((m = s.match(/^_stc\d*\.setPin\s*\(\s*"([^"]+)"\s*,\s*"(on|off|high|low)"\s*\)$/))) {
            emit(depth, (m[2] === 'on' || m[2] === 'off') ? `turn ${m[2]} ${m[1]}` : `set ${m[1]} ${m[2]}`);
            continue;
        }
        if ((m = s.match(/^_stc\d*\.writePin\s*\(\s*"([^"]+)"\s*,\s*(.+?)\s*\)$/))) {
            emit(depth, `set ${m[1]} to ${expr(m[2])}`); continue;
        }
        if ((m = s.match(/^_stc\d*\.togglePin\s*\(\s*"([^"]+)"\s*\)$/))) {
            emit(depth, `toggle ${m[1]}`); continue;
        }

        // Digital writes. A literal is on/off (through the polarity); anything
        // computed is a LEVEL, which ACTIVE LOW does not invert -- the same
        // rule the C reader follows, for the same reason.
        if ((m = s.match(/^(\w+)\.(?:write_digital|value)\s*\(\s*(.+?)\s*\)$/))) {
            const rec = byObj.get(m[1]);
            if (rec) {
                const n = Number(m[2]);
                if (Number.isFinite(n)) {
                    const on = rec.activeLow ? n === 0 : n !== 0;
                    emit(depth, `turn ${on ? 'on' : 'off'} ${rec.name}`);
                } else emit(depth, `set ${rec.name} to ${expr(m[2])}`);
                continue;
            }
        }
        // PWM. Undo the writer's scaling so a percentage comes back a percentage.
        if ((m = s.match(/^(\w+)\.write_analog\s*\(\s*(.+?)\s*\)$/))) {
            const rec = byObj.get(m[1]);
            if (rec) { emit(depth, `set ${rec.name} to ${unscale(expr(m[2]), 1023)} percent`); continue; }
        }
        if ((m = s.match(/^(\w+)\.duty_u16\s*\(\s*(.+?)\s*\)$/))) {
            const rec = byObj.get(m[1]);
            if (rec && rec.direction === 'tone') continue;   // handled with the _hz block
            if (rec) { emit(depth, `set ${rec.name} to ${unscale(expr(m[2]), 65535)} percent`); continue; }
        }
        if ((m = s.match(/^(\w+)\.freq\s*\(\s*(.+?)\s*\)$/))) {
            const rec = byObj.get(m[1]);
            if (rec && rec.direction === 'tone') { emit(depth, `set ${rec.name} to ${expr(m[2])} hz`); continue; }
            continue;   // the 1 kHz carrier a PWM pin is set up with
        }
        // A tone. The scheduler emitter writes `music.pitch(int(N), wait=False)`,
        // so the frequency is wrapped in int(...) — the old bare-digit match
        // missed it and the whole line grey-blocked.
        if ((m = s.match(/^music\.pitch\s*\(\s*int\(\s*(.+?)\s*\)\s*(?:,|\))/)) || (m = s.match(/^music\.pitch\s*\(\s*(\d+)/))) {
            const tone = [...pins.values()].find((p) => p.direction === 'tone');
            emit(depth, `set ${tone ? tone.name : 'buzzer'} to ${expr(m[1])} hz`); continue;
        }
        if (/^if\s+_hz\s*:$|^music\.stop\s*\(/.test(s)) continue;

        // micro:bit radio. `radio on group G power P` emits a config + an on();
        // the two lift together. `radio send number N` is send(str(N)); `radio
        // send text "..."` is send('...').
        if ((m = s.match(/^radio\.config\s*\(\s*group=int\(\s*(.+?)\s*\)\s*,\s*power=int\(\s*(.+?)\s*\)\s*\)$/))) {
            emit(depth, `radio on group ${expr(m[1])} power ${expr(m[2])}`);
            if (lines[i + 1] && /^radio\.on\s*\(\s*\)$/.test(lines[i + 1].code.trim())) i++;
            continue;
        }
        if ((m = s.match(/^radio\.send\s*\(\s*str\(\s*(.+?)\s*\)\s*\)$/))) { emit(depth, `radio send number ${expr(m[1])}`); continue; }
        if ((m = s.match(/^radio\.send\s*\(\s*'([^']*)'\s*\)$/)) || (m = s.match(/^radio\.send\s*\(\s*"([^"]*)"\s*\)$/))) {
            emit(depth, `radio send text "${m[1]}"`); continue;
        }

        // `change v by X` is emitted as `v = v + X` with the operand UNwrapped;
        // a genuine `set v to (v + X)` keeps the reporter's parentheses (`v =
        // (v + X)`). The bare-`+` form after `=` is therefore the change verb,
        // and lifting it as such is both the right block and byte-exact on
        // re-emission.
        if ((m = s.match(/^([A-Za-z_]\w*)\s*=\s*\1\s*\+\s*(.+)$/))) {
            emit(depth, `change ${m[1]} by ${expr(m[2])}`); continue;
        }
        // Plain assignment.
        if ((m = s.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/)) && !/[=<>!]=/.test(m[0].slice(m[1].length))) {
            emit(depth, `set ${m[1]} to ${expr(m[2])}`); continue;
        }
        // A scheduler task spells `wait N seconds` as a yield of milliseconds
        // (`yield int((N) * 1000)`); the emitter's own form, reversed here so the
        // wait is not lost. The bare `yield 0` at a loop back-edge, and every
        // other yield, is control flow rather than a statement and rides on to
        // the skip below.
        if ((m = s.match(/^yield\s+int\s*\(\s*\((.+)\)\s*\*\s*1000\s*\)$/))) {
            emit(depth, `wait ${expr(m[1])} seconds`); continue;
        }
        // A `pass` the emitter left a comment on is a block it could NOT
        // translate for this board — overwhelmingly an 8051 pin write with no
        // micro:bit/Pico equivalent. Dropping it silently is the exact loss the
        // coverage audit exists to end, so name it: a `#` pseudocode comment
        // (which parse() ignores, so it is not re-emitted) plus a degraded
        // warning. This does not round-trip and is not meant to — a named loss,
        // not a recovered one.
        if (s === 'pass' && l.comment) {
            const pin = l.comment.match(/^pin\s+(.+)$/i);
            const why = pin
                ? `pin ${pin[1]}: no equivalent on this board; the 8051 pin block was not translated`
                : `${l.comment}: no equivalent on this board; the block was not translated`;
            emit(depth, `# ${why}`);
            warn(why);
            continue;
        }
        if (/^(yield|pass|global|return)\b/.test(s)) continue;

        // GREY BLOCK: what this reader cannot translate it PRESERVES —
        // a `raw "<line>"` statement the MicroPython emitter re-emits
        // verbatim, so import → edit → export loses nothing. The warning
        // stays: the user should know which lines ride along untranslated.
        emit(depth, `raw "${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
        warn(`kept verbatim as a grey block: "${s.slice(0, 60)}"`);
    }

    // `x * 1023 // 100` is how a percentage was written to the hardware. Undoing
    // it is not cosmetic: leaving it in would make the pseudocode say a duty of
    // 1023 where the author wrote 100.
    function unscale (e, full) {
        const re = new RegExp(`^\\(?(.+?)\\)?\\s*\\*\\s*${full}\\s*/\\s*100$`);
        const m = String(e).match(re);
        return m ? m[1].trim() : e;
    }

    if (markerDevice && !opts.device) device = markerDevice;
    const head = [`DEVICE ${device.toUpperCase()}`, 'CLOCK 16000000'];
    const pinList = [...pins.values()];
    if (pinList.length) {
        head.push('');
        for (const p of pinList) {
            head.push(`PIN ${p.name} = ${p.where} ${p.direction.toUpperCase()}`
                + (p.activeLow ? ' ACTIVE LOW' : ''));
        }
    } else warn('no pins found — this reader discovers them from Pin()/pinN calls');

    const body = out.length ? ['', 'WHEN flag clicked:', ...out] : ['', 'WHEN flag clicked:', '  stop'];
    return { pseudocode: [...head, ...body].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', warnings };
}
