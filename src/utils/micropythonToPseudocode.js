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
    const put = (obj, where, direction, activeLow, name) => {
        const prev = pins.get(where);
        if (prev) {
            if (direction && RANK[direction] > RANK[prev.direction]) prev.direction = direction;
            if (activeLow) prev.activeLow = true;
            if (name) prev.name = name;
            byObj.set(obj, prev);
            return prev;
        }
        const rec = { name: name || where.toLowerCase(), where, direction: direction || 'output',
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

    // The generated program puts the script in bw_script(); a hand-written one
    // is usually just a `while True:` at module level. Both are one script.
    let start = 0, bodyIndent = 0;
    const fn = lines.findIndex((l) => /^def\s+bw_script\s*\(/.test(l.code));
    if (fn !== -1) { start = fn + 1; bodyIndent = 4; } else {
        const w = lines.findIndex((l) => /^\s*while\s+True\s*:/.test(l.code));
        if (w === -1) warn('no bw_script() and no `while True:` — nothing that looks like a script');
        start = w === -1 ? lines.length : w;
        bodyIndent = lines[start] ? lines[start].indent : 0;
    }

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
        if ((m = s.match(/^while\s+(.+?)\s*:$/))) { emit(depth, `REPEAT UNTIL not (${expr(m[1])}):`); continue; }
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
        if ((m = s.match(/^print\s*\(\s*(.*)\s*\)$/))) { emit(depth, `print ${expr(m[1])}`); continue; }

        // A toggle is two statements on the micro:bit; the dictionary write is
        // bookkeeping and the pin write is the act, so the pair collapses.
        if ((m = s.match(/^_level\s*\[\s*'([^']+)'\s*\]\s*=\s*1\s*-\s*_level/))) {
            const next = lines[i + 1];
            if (next && /\.write_digital\s*\(\s*_level\s*\[/.test(next.code)) {
                emit(depth, `toggle ${m[1]}`); i++; continue;
            }
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
        if ((m = s.match(/^music\.pitch\s*\(\s*(\d+)/))) {
            const tone = [...pins.values()].find((p) => p.direction === 'tone');
            emit(depth, `set ${tone ? tone.name : 'buzzer'} to ${m[1]} hz`); continue;
        }
        if (/^if\s+_hz\s*:$|^music\.stop\s*\(/.test(s)) continue;

        // Plain assignment.
        if ((m = s.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/)) && !/[=<>!]=/.test(m[0].slice(m[1].length))) {
            emit(depth, `set ${m[1]} to ${expr(m[2])}`); continue;
        }
        if (/^(yield|pass|global|return)\b/.test(s)) continue;

        warn(`no pseudocode for "${s.slice(0, 60)}" — left out`);
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
