/**
 * The reference trace interpreter — the referee every backend answers to.
 *
 * Executes a parsed project's blocks under Scratch's own cooperative
 * contract (tasks yield at waits and loop back-edges) on a VIRTUAL
 * millisecond clock, and records the canonical trace defined in
 * reference/corpus-and-oracles.md: pin ON/OFF intent by LOGICAL name,
 * polarity-normalized; serial lines; PWM percents; final variables.
 *
 * Deliberately independent of all four backends — a fifth opinion. It
 * implements the same yield points the C scheduler compiles to, but from
 * the block AST directly, so a codegen bug cannot vouch for itself.
 *
 * Time is event-driven: when every live task is waiting, the clock JUMPS
 * to the earliest deadline — a 10-second program traces in microseconds
 * of wall time. A `stimulus` timeline scripts analog/digital inputs, so
 * ADC and button programs are deterministic too.
 *
 * Unknown opcodes REFUSE loudly (listed in `unsupported`), never skip —
 * a silent skip would let the corpus drift beyond what the referee
 * actually referees.
 *
 * @module
 */

/** Opcode surface the referee speaks. Everything else is a stated refusal. */
const KNOWN = new Set([
    'event_whenflagclicked',
    'control_forever', 'control_repeat', 'control_if', 'control_if_else',
    'control_wait', 'control_wait_until', 'control_repeat_until',
    'data_setvariableto', 'data_changevariableby',
    'stc12_setpin', 'stc12_toggle', 'stc12_writepin', 'stc12_setpwm',
    'stc12_settone', 'stc12_print', 'stc12_read', 'stc12_setpart',
    'devices_setservo', 'devices_servoangle',
    'devices_setmotor', 'devices_motorspeed', 'devices_motordirection',
    'devices_setdirection',
    'operator_add', 'operator_subtract', 'operator_multiply', 'operator_divide',
    'operator_mod', 'operator_gt', 'operator_lt', 'operator_equals',
    'operator_and', 'operator_or', 'operator_not', 'operator_join', 'operator_round',
    'operator_letter_of', 'operator_length', 'operator_contains',
    'operator_mathop', 'operator_random',
    'sensing_timer',
    'data_addtolist', 'data_deleteoflist', 'data_insertatlist',
    'data_replaceitemoflist', 'data_itemoflist', 'data_lengthoflist',
    'data_listcontainsitem',
    'bitops_and', 'bitops_or', 'bitops_xor', 'bitops_shl', 'bitops_shr', 'bitops_not',
    'procedures_call', 'argument_reporter_string_number', 'argument_reporter_boolean',
]);

/**
 * @param {object} project - a parsed SB3Creator project (targets + stc config)
 * @param {object} [opts]
 * @param {number} [opts.horizonMs] - how much program time to trace (default 5000)
 * @param {Array<{tMs:number,pin:string,volts?:number,level?:0|1}>} [opts.stimulus]
 *   scripted inputs by LOGICAL pin name; the latest entry at-or-before now wins
 * @param {Array<{tMs:number,part:string,param:string,value:number}>} [opts.partStimulus]
 *   scripted part-param inputs (e.g. ultrasonic distance, accelerometer g):
 *   at any read, the latest entry at-or-before now for that part+param wins.
 *   Used for sensor examples where the stimulus is not a pin voltage but a
 *   world-facing parameter (knock force, distance, tilt vector, touch state).
 * @param {number} [opts.maxSteps] - runaway guard (default 1e6)
 * @param {{bits:number, vref:number}} [opts.adc] - the DEVICE'S ADC
 *   resolution and reference (8051/AVR: 10 bits of 5 V; Pico: 12 of 3.3).
 *   Raw counts are program-visible (print read pot), so the referee must
 *   speak the device's numbers — this is genuine device-dependence, not
 *   a normalization the comparator may paper over.
 * @returns {{ events: [], pwm: [], serial: [], vars: {}, horizon: number,
 *             unsupported: string[] }}
 */
export function interpretTrace(project, opts = {}) {
    const horizonMs = opts.horizonMs ?? 5000;
    const maxSteps = opts.maxSteps ?? 1e6;
    const stimulus = [...(opts.stimulus ?? [])].sort((a, b) => a.tMs - b.tMs);
    const partStimulus = [...(opts.partStimulus ?? [])].sort((a, b) => a.tMs - b.tMs);
    const adc = opts.adc ?? { bits: 10, vref: 5 };

    const stc = (project && project.stc) || { pins: [] };
    const pinsByName = new Map((stc.pins || []).map((p) => [String(p.name).toLowerCase(), p]));
    const partsByName = new Map((stc.parts || []).map((p) => [String(p.name).toLowerCase(), p]));

    const trace = { events: [], pwm: [], tones: [], serial: [], devices: [], vars: {}, horizon: horizonMs, unsupported: [] };
    // Device state: servo angle, motor speed/direction — readable by reporters.
    const deviceState = new Map(); // name → { angle?, speed?, dir? }
    // Every pin starts at intent 0 — the implicit boot state on every core
    // (the C builds write the OFF level in bw_setup). Seeding the dedup map
    // means a leading 'turn off' records nothing, on the referee AND on any
    // recorder that follows the same rule: baseline noise dies at the source.
    const pinLevel = new Map();   // logical name -> last recorded intent, dedup
    for (const p of stc.pins || []) {
        if (p.direction === 'output' || p.direction === 'pwm') {
            pinLevel.set(String(p.name).toLowerCase(), 0);
        }
    }

    const vars = new Map();
    const lists = new Map(); // name → array of values
    let now = 0;

    const emitPin = (name, intent) => {
        const key = String(name).toLowerCase();
        if (pinLevel.get(key) === intent) return; // level changes only
        pinLevel.set(key, intent);
        trace.events.push({ tMs: now, pin: key, level: intent });
    };

    const stimAt = (name) => {
        const key = String(name).toLowerCase();
        let hit = null;
        for (const s of stimulus) {
            if (s.tMs > now) break;
            if (String(s.pin).toLowerCase() === key) hit = s;
        }
        return hit;
    };

    /** Lookup part-param stimulus value at current time. */
    const partStimAt = (partName, param) => {
        const pk = String(partName).toLowerCase();
        const pp = String(param).toLowerCase();
        let hit = null;
        for (const s of partStimulus) {
            if (s.tMs > now) break;
            if (String(s.part).toLowerCase() === pk && String(s.param).toLowerCase() === pp) hit = s;
        }
        return hit ? hit.value : undefined;
    };

    // ---- collect the tasks ------------------------------------------------
    /** A frame: { block: currentBlockId|null, loop: {kind, remaining?, headId} } */
    const tasks = [];
    const blocksOf = new Map(); // task -> its target's blocks object
    for (const target of project.targets || []) {
        const blocks = target.blocks || {};
        for (const b of Object.values(blocks)) {
            if (b && b.opcode === 'event_whenflagclicked' && b.topLevel !== false) {
                tasks.push({ frames: [{ block: b.next }], waitUntil: 0, done: !b.next,
                    spinNow: -1, spins: 0 });
                blocksOf.set(tasks[tasks.length - 1], blocks);
            }
        }
    }

    // ---- expression evaluation -------------------------------------------
    function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

    /** Extract a device/part name from an input (type 12/13 = variable-reference format). */
    function nameInput(input) {
        if (!input) return '';
        const v = input[1];
        if (Array.isArray(v) && (v[0] === 12 || v[0] === 13)) return String(v[1]);
        if (Array.isArray(v)) return String(v[1]);
        return String(v ?? '');
    }

    function evalInput(task, input) {
        // SB3 input: [shadowType, blockIdOrLiteral] — mirror cVal's reading.
        if (!input) return 0;
        const v = input[1];
        if (Array.isArray(v)) {
            // [12, name, id] is an INLINE VARIABLE REFERENCE, not a literal —
            // returning index 1 hands back the variable's NAME (the referee's
            // first print test printed the string "n").
            if (v[0] === 12 || v[0] === 13) return vars.get(v[1]) ?? 0;
            return v[1];                               // literal [type, value]
        }
        if (typeof v === 'string') return evalBlock(task, v); // reporter block id
        return v ?? 0;
    }

    function evalBlock(task, id) {
        const blocks = blocksOf.get(task);
        const b = blocks[id];
        if (!b) return 0;
        const inp = (k) => evalInput(task, b.inputs && b.inputs[k]);
        const fld = (k) => (b.fields && b.fields[k] ? b.fields[k][0] : '');
        switch (b.opcode) {
            case 'operator_add': return num(inp('NUM1')) + num(inp('NUM2'));
            case 'operator_subtract': return num(inp('NUM1')) - num(inp('NUM2'));
            case 'operator_multiply': return num(inp('NUM1')) * num(inp('NUM2'));
            case 'operator_divide': {
                const d = num(inp('NUM2'));
                // Integer semantics: every C backend divides integers.
                return d ? Math.trunc(num(inp('NUM1')) / d) : 0;
            }
            case 'operator_mod': { const d = num(inp('NUM2')); return d ? num(inp('NUM1')) % d : 0; }
            case 'operator_gt': return num(inp('OPERAND1')) > num(inp('OPERAND2'));
            case 'operator_lt': return num(inp('OPERAND1')) < num(inp('OPERAND2'));
            case 'operator_equals': return num(inp('OPERAND1')) === num(inp('OPERAND2'));
            case 'operator_and': return !!(evalInput(task, b.inputs.OPERAND1) && evalInput(task, b.inputs.OPERAND2));
            case 'operator_or': return !!(evalInput(task, b.inputs.OPERAND1) || evalInput(task, b.inputs.OPERAND2));
            case 'operator_not': return !evalInput(task, b.inputs.OPERAND);
            case 'operator_join': return String(inp('STRING1')) + String(inp('STRING2'));
            case 'operator_round': return Math.round(num(inp('NUM')));
            case 'operator_letter_of': {
                const idx = Math.round(num(inp('LETTER')));
                const str = String(inp('STRING'));
                return (idx >= 1 && idx <= str.length) ? str[idx - 1] : '';
            }
            case 'operator_length': return String(inp('STRING')).length;
            case 'operator_contains': return String(inp('STRING1')).toLowerCase().includes(String(inp('STRING2')).toLowerCase());
            case 'operator_mathop': {
                const v = num(inp('NUM'));
                switch (fld('OPERATOR')) {
                    case 'abs': return Math.abs(v);
                    case 'floor': return Math.floor(v);
                    case 'ceiling': return Math.ceil(v);
                    case 'sqrt': return Math.sqrt(v);
                    case 'sin': return Math.sin(v * Math.PI / 180);
                    case 'cos': return Math.cos(v * Math.PI / 180);
                    case 'tan': return Math.tan(v * Math.PI / 180);
                    case 'asin': return Math.asin(v) * 180 / Math.PI;
                    case 'acos': return Math.acos(v) * 180 / Math.PI;
                    case 'atan': return Math.atan(v) * 180 / Math.PI;
                    case 'ln': return Math.log(v);
                    case 'log': return Math.log10(v);
                    case 'e ^': return Math.exp(v);
                    case '10 ^': return Math.pow(10, v);
                    default: return 0;
                }
            }
            case 'operator_random': {
                // Deterministic: the referee uses a fixed value (midpoint of range)
                // so traces are reproducible. Real hardware uses hardware RNG.
                const lo = num(inp('FROM')), hi = num(inp('TO'));
                return Math.round((lo + hi) / 2);
            }
            case 'data_itemoflist': {
                const list = lists.get(fld('LIST')) ?? [];
                const idx = Math.round(num(inp('INDEX')));
                return (idx >= 1 && idx <= list.length) ? list[idx - 1] : '';
            }
            case 'data_lengthoflist': return (lists.get(fld('LIST')) ?? []).length;
            case 'data_listcontainsitem': {
                const list = lists.get(fld('LIST')) ?? [];
                const item = inp('ITEM');
                return list.some(v => String(v) === String(item));
            }
            case 'bitops_and': return num(inp('NUM1')) & num(inp('NUM2'));
            case 'bitops_or': return num(inp('NUM1')) | num(inp('NUM2'));
            case 'bitops_xor': return num(inp('NUM1')) ^ num(inp('NUM2'));
            case 'bitops_shl': return num(inp('NUM1')) << num(inp('NUM2'));
            case 'bitops_shr': return num(inp('NUM1')) >> num(inp('NUM2'));
            case 'bitops_not': return ~num(inp('NUM'));
            case 'data_variable': return vars.get(fld('VARIABLE')) ?? 0;
            case 'sensing_timer': return now / 1000; // elapsed seconds
            // Custom-block parameters: the nearest enclosing procedure
            // frame that binds this name wins (nested calls shadow).
            case 'argument_reporter_string_number':
            case 'argument_reporter_boolean': {
                for (let k = task.frames.length - 1; k >= 0; k--) {
                    const a = task.frames[k].args;
                    if (a && a.has(fld('VALUE'))) return a.get(fld('VALUE'));
                }
                return 0;
            }
            case 'stc12_read': {
                const pin = pinsByName.get(String(fld('PIN')).toLowerCase());
                const s = stimAt(fld('PIN'));
                if (pin && pin.direction === 'analog') {
                    const full = (1 << adc.bits) - 1;
                    return s && s.volts !== undefined
                        ? Math.max(0, Math.min(full, Math.round((s.volts / adc.vref) * full)))
                        : 0;
                }
                return s ? (s.level ? 1 : 0) : 0;
            }
            case 'devices_servoangle': {
                const ds = deviceState.get(nameInput(b.inputs && b.inputs.SERVO).toLowerCase());
                return ds ? (ds.angle ?? 0) : 0;
            }
            case 'devices_motorspeed': {
                const ds = deviceState.get(nameInput(b.inputs && b.inputs.MOTOR).toLowerCase());
                return ds ? (ds.speed ?? 0) : 0;
            }
            case 'devices_motordirection': {
                const ds = deviceState.get(nameInput(b.inputs && b.inputs.MOTOR).toLowerCase());
                return ds ? (ds.dir ?? 0) : 0;
            }
            default:
                trace.unsupported.push(b.opcode);
                return 0;
        }
    }

    // ---- one cooperative step of one task --------------------------------
    // Runs the task until it YIELDS (wait or loop back-edge) or its script
    // ends. Mirrors cTaskFrom's yield structure exactly.
    function step(task) {
        const blocks = blocksOf.get(task);
        let guard = 0;
        while (guard++ < 10000) {
            const frame = task.frames[task.frames.length - 1];
            if (!frame) { task.done = true; return; }
            const id = frame.block;
            if (!id) {
                // end of this frame's chain: loops rewind (and YIELD), plain
                // substacks pop back to their parent's `next`.
                const fin = task.frames.pop();
                // Re-pushed frames MUST carry `after` forward: the first
                // version dropped it, so any repeat that finished after its
                // first iteration nulled the parent's continuation and the
                // task died silently right after the loop.
                if (fin.loop && fin.loop.kind === 'forever') {
                    task.frames.push({ block: fin.loop.headId, loop: fin.loop, after: fin.after });
                    return; // loop back-edge = yield (Scratch's contract)
                }
                if (fin.loop && fin.loop.kind === 'repeat') {
                    if (--fin.loop.remaining > 0) {
                        task.frames.push({ block: fin.loop.headId, loop: fin.loop, after: fin.after });
                        return; // back-edge yield
                    }
                    // fall through: repeat finished; parent continues below
                }
                if (fin.loop && fin.loop.kind === 'until') {
                    if (!evalInput(task, fin.loop.cond)) {
                        task.frames.push({ block: fin.loop.headId, loop: fin.loop, after: fin.after });
                        return; // back-edge yield, condition still false
                    }
                    // condition true: fall through, parent continues below
                }
                const parent = task.frames[task.frames.length - 1];
                if (parent) parent.block = fin.after ?? null;
                continue;
            }
            const b = blocks[id];
            if (!b) { frame.block = null; continue; }
            const inp = (k) => evalInput(task, b.inputs && b.inputs[k]);
            const fld = (k) => (b.fields && b.fields[k] ? b.fields[k][0] : '');
            const substack = (k) => {
                const s = b.inputs && b.inputs[k];
                return s && typeof s[1] === 'string' ? s[1] : null;
            };
            if (!KNOWN.has(b.opcode)) trace.unsupported.push(b.opcode);
            switch (b.opcode) {
                case 'control_wait': {
                    task.waitUntil = now + Math.round(num(inp('DURATION')) * 1000);
                    frame.block = b.next;
                    return; // yield
                }
                case 'control_wait_until': {
                    // The C scheduler re-checks the condition every main-loop
                    // pass (a continuous busy-poll); the referee re-polls at
                    // 1 ms virtual granularity — conditions only change via
                    // stimulus (ms-grained) or other tasks (which run at
                    // yields), so the coarser poll is faithful within tol.
                    if (evalInput(task, b.inputs.CONDITION)) {
                        frame.block = b.next;
                        continue;
                    }
                    task.waitUntil = now + 1;
                    return; // yield in place, re-check on the next tick
                }
                case 'control_repeat_until': {
                    const head = substack('SUBSTACK');
                    if (evalInput(task, b.inputs.CONDITION) || !head) {
                        frame.block = b.next;
                        continue;
                    }
                    task.frames.push({ block: head,
                        loop: { kind: 'until', headId: head, cond: b.inputs.CONDITION },
                        after: b.next });
                    continue;
                }
                case 'control_forever': {
                    const head = substack('SUBSTACK');
                    task.frames.push({ block: head, loop: { kind: 'forever', headId: head }, after: b.next });
                    continue;
                }
                case 'control_repeat': {
                    const times = Math.round(num(inp('TIMES')));
                    const head = substack('SUBSTACK');
                    if (times > 0 && head) {
                        task.frames.push({ block: head, loop: { kind: 'repeat', headId: head, remaining: times }, after: b.next });
                    } else frame.block = b.next;
                    continue;
                }
                case 'control_if': {
                    const head = substack('SUBSTACK');
                    if (evalInput(task, b.inputs.CONDITION) && head) {
                        task.frames.push({ block: head, after: b.next });
                    } else frame.block = b.next;
                    continue;
                }
                case 'control_if_else': {
                    const head = evalInput(task, b.inputs.CONDITION)
                        ? substack('SUBSTACK') : substack('SUBSTACK2');
                    if (head) task.frames.push({ block: head, after: b.next });
                    else frame.block = b.next;
                    continue;
                }
                case 'data_setvariableto': vars.set(fld('VARIABLE'), inp('VALUE')); frame.block = b.next; continue;
                case 'data_changevariableby': {
                    const k = fld('VARIABLE');
                    vars.set(k, num(vars.get(k) ?? 0) + num(inp('VALUE')));
                    frame.block = b.next; continue;
                }
                case 'data_addtolist': {
                    const k = fld('LIST');
                    if (!lists.has(k)) lists.set(k, []);
                    lists.get(k).push(inp('ITEM'));
                    frame.block = b.next; continue;
                }
                case 'data_deleteoflist': {
                    const k = fld('LIST');
                    const list = lists.get(k);
                    if (list) {
                        const idx = Math.round(num(inp('INDEX')));
                        if (idx >= 1 && idx <= list.length) list.splice(idx - 1, 1);
                        else if (idx === list.length + 1 || String(inp('INDEX')) === 'last') list.pop();
                        else if (String(inp('INDEX')) === 'all') list.length = 0;
                    }
                    frame.block = b.next; continue;
                }
                case 'data_insertatlist': {
                    const k = fld('LIST');
                    if (!lists.has(k)) lists.set(k, []);
                    const list = lists.get(k);
                    const idx = Math.round(num(inp('INDEX')));
                    if (idx >= 1 && idx <= list.length + 1) list.splice(idx - 1, 0, inp('ITEM'));
                    frame.block = b.next; continue;
                }
                case 'data_replaceitemoflist': {
                    const k = fld('LIST');
                    const list = lists.get(k);
                    if (list) {
                        const idx = Math.round(num(inp('INDEX')));
                        if (idx >= 1 && idx <= list.length) list[idx - 1] = inp('ITEM');
                    }
                    frame.block = b.next; continue;
                }
                case 'stc12_setpin': {
                    const state = fld('STATE');
                    const pin = pinsByName.get(String(fld('PIN')).toLowerCase());
                    // Intent normalization: on/off ARE intent; high/low are
                    // physical and cross polarity to become intent.
                    let intent;
                    if (state === 'on') intent = 1;
                    else if (state === 'off') intent = 0;
                    else intent = ((state === 'high') !== !!(pin && pin.activeLow)) ? 1 : 0;
                    emitPin(fld('PIN'), intent);
                    frame.block = b.next; continue;
                }
                case 'stc12_toggle': {
                    const key = String(fld('PIN')).toLowerCase();
                    emitPin(fld('PIN'), pinLevel.get(key) ? 0 : 1);
                    frame.block = b.next; continue;
                }
                case 'stc12_writepin': {
                    const pin = pinsByName.get(String(fld('PIN')).toLowerCase());
                    const level = num(inp('VALUE')) ? 1 : 0; // physical
                    emitPin(fld('PIN'), (level === 1) !== !!(pin && pin.activeLow) ? 1 : 0);
                    frame.block = b.next; continue;
                }
                case 'stc12_setpwm': {
                    let pct = num(inp('VALUE'));
                    pct = Math.max(0, Math.min(100, pct));
                    trace.pwm.push({ tMs: now, pin: String(fld('PIN')).toLowerCase(), percent: pct });
                    frame.block = b.next; continue;
                }
                case 'stc12_settone': {
                    const hz = Math.max(0, Math.round(num(inp('VALUE'))));
                    trace.tones.push({ tMs: now, pin: String(fld('PIN')).toLowerCase(), hz });
                    frame.block = b.next; continue;
                }
                case 'stc12_print': {
                    const v = inp('VALUE');
                    trace.serial.push({ tMs: now, line: String(v) });
                    frame.block = b.next; continue;
                }
                case 'stc12_setpart': {
                    // 74HC595 shift register: shift_out(data, clock, latch, activeLow, value).
                    // Observable: 8 data+clock bit-bangs then a latch pulse.
                    // The referee records the part-level event; the emulator's
                    // shift_out() helper produces the same pin sequence.
                    const partName = fld('PART');
                    const value = num(inp('VALUE')) & 0xFF;
                    const partCfg = partsByName.get(String(partName).toLowerCase());
                    if (partCfg) {
                        const al = !!partCfg.activeLow;
                        // Record pin-level events for data/clock/latch
                        // Keys are LOGICAL (part.role), not physical coordinates:
                        // the physical shape differs per device dialect ({port,bit}
                        // on STC, {where:"D13"} on Arduino/Pico) and cross-device
                        // trace identity is defined over logical names — like every
                        // other emitPin site, which uses the pin's logical name.
                        const pfx = String(partName).toLowerCase();
                        const dataKey = `${pfx}.data`;
                        const clockKey = `${pfx}.clock`;
                        const latchKey = `${pfx}.latch`;
                        // Latch low to start
                        emitPin(latchKey, al ? 1 : 0);
                        for (let bit = 7; bit >= 0; bit--) {
                            const bitVal = (value >> bit) & 1;
                            emitPin(dataKey, al ? (bitVal ? 0 : 1) : bitVal);
                            emitPin(clockKey, al ? 0 : 1);  // clock high
                            emitPin(clockKey, al ? 1 : 0);  // clock low
                        }
                        // Latch pulse
                        emitPin(latchKey, al ? 0 : 1);
                        emitPin(latchKey, al ? 1 : 0);
                    }
                    trace.devices.push({ tMs: now, kind: 'shift_out', name: String(partName).toLowerCase(), value });
                    frame.block = b.next; continue;
                }
                case 'devices_setservo': {
                    // Servo: record angle as a device event + track state.
                    // The emulator captures bw_servo_set(name, angle).
                    const name = nameInput(b.inputs && b.inputs.SERVO).toLowerCase();
                    const angle = Math.max(0, Math.min(180, Math.round(num(inp('ANGLE')))));
                    if (!deviceState.has(name)) deviceState.set(name, {});
                    deviceState.get(name).angle = angle;
                    trace.devices.push({ tMs: now, kind: 'servo', name, angle });
                    frame.block = b.next; continue;
                }
                case 'devices_setmotor': {
                    const name = nameInput(b.inputs && b.inputs.MOTOR).toLowerCase();
                    const speed = Math.max(0, Math.min(255, Math.round(num(inp('SPEED')))));
                    if (!deviceState.has(name)) deviceState.set(name, {});
                    deviceState.get(name).speed = speed;
                    trace.devices.push({ tMs: now, kind: 'motor_speed', name, speed });
                    frame.block = b.next; continue;
                }
                case 'devices_setdirection': {
                    const name = nameInput(b.inputs && b.inputs.MOTOR).toLowerCase();
                    const dir = fld('DIR');
                    const dirNum = ({ forward: 0, reverse: 1, brake: 2, coast: 3 })[dir] ?? 0;
                    if (!deviceState.has(name)) deviceState.set(name, {});
                    deviceState.get(name).dir = dirNum;
                    trace.devices.push({ tMs: now, kind: 'motor_dir', name, dir: dirNum });
                    frame.block = b.next; continue;
                }
                case 'procedures_call': {
                    // Find the definition by proccode, bind arguments into
                    // the new frame, continue at the body (no yield on entry
                    // — Scratch's contract). The host oracle exposed this
                    // gap: BBCSDL printed a procedure's output while the
                    // referee silently listed the call as unsupported.
                    const proccode = b.mutation && b.mutation.proccode;
                    let def = null;
                    let proto = null;
                    for (const cand of Object.values(blocks)) {
                        if (cand.opcode !== 'procedures_definition') continue;
                        const p = blocks[cand.inputs.custom_block[1]];
                        if (p && p.mutation && p.mutation.proccode === proccode) { def = cand; proto = p; break; }
                    }
                    if (!def) { trace.unsupported.push(`procedures_call:${proccode}`); frame.block = b.next; continue; }
                    const names = JSON.parse(proto.mutation.argumentnames || '[]');
                    const ids = JSON.parse(b.mutation.argumentids || '[]');
                    const args = new Map();
                    names.forEach((nm, k) => args.set(nm, evalInput(task, b.inputs && b.inputs[ids[k]])));
                    // Same shape as a plain substack: on pop, the caller
                    // frame's block becomes `after` — the statement past
                    // the call.
                    task.frames.push({ block: def.next, after: b.next, args });
                    continue;
                }
                default:
                    frame.block = b.next; continue;
            }
        }
        throw new Error('referee: 10000 blocks without a yield — an unyielding loop?');
    }

    // ---- the scheduler ----------------------------------------------------
    let steps = 0;
    while (now <= horizonMs && steps++ < maxSteps) {
        let ran = false;
        for (const task of tasks) {
            if (task.done || task.waitUntil > now) continue;
            step(task);
            ran = true;
            // A loop that yields without EVER advancing time is a busy spin:
            // on the chip, real time passes and the loop runs at CPU speed
            // (the LED-dice counter cycles megahertz-fast while a button is
            // held — its whole POINT is hardware-timing randomness). The
            // referee cannot predict that and refuses BY NAME instead of
            // spinning its virtual clock forever at one instant.
            if (task.spinNow === now) {
                if (++task.spins > 1000) {
                    trace.unsupported.push('busy-loop:zero-time-spin');
                    task.done = true;
                }
            } else { task.spinNow = now; task.spins = 0; }
        }
        if (tasks.every((t) => t.done)) break;
        if (!ran || tasks.every((t) => t.done || t.waitUntil > now)) {
            // Everyone is waiting: jump to the earliest deadline.
            const next = Math.min(...tasks.filter((t) => !t.done).map((t) => t.waitUntil));
            if (!Number.isFinite(next) || next <= now) break;
            now = next;
        }
    }
    for (const [k, v] of vars) trace.vars[k] = v;
    trace.lists = {};
    for (const [k, v] of lists) trace.lists[k] = [...v];
    trace.events = trace.events.filter((e) => e.tMs <= horizonMs);
    trace.serial = trace.serial.filter((e) => e.tMs <= horizonMs);
    trace.devices = trace.devices.filter((e) => e.tMs <= horizonMs);
    trace.tones = trace.tones.filter((e) => e.tMs <= horizonMs);
    return trace;
}

/**
 * Compare an actual trace (a backend under an emulator) against the
 * referee's. Rules learned from the first live differential:
 *  - the C build's bw_setup writes every output's OFF level at boot; a
 *    leading level-0 event before the referee's first event is hygiene,
 *    not behaviour — dropped.
 *  - the horizon is half-open: events AT the horizon are optional on
 *    either side (one trace may cut before the other).
 *  - event order and levels are EXACT; times within `tolMs`.
 *  - serial lines exact; times within `tolMs`. PWM percents within 2.
 *
 * @returns {{ ok: boolean, diffs: string[] }}
 */
export function compareTraces(ref, actual, opts = {}) {
    const tolMs = opts.tolMs ?? 3;
    // Blocking-UART drift: a device whose putc waits on the wire (the
    // AVR at 9600 baud: ~1.04 ms/byte, no deep FIFO) pushes every LATER
    // deadline by the bytes it has printed so far — the Nano's third
    // 1-second print lands 8 ms late, exactly its cumulative byte time.
    // The referee prints instantaneously, so the allowance grows with
    // the referee's own serial byte count before each compared item.
    // Devices with a real FIFO (the Pico's is 16 deep) pass 0 here.
    const msPerByte = opts.serialMsPerByte ?? 0;
    // Slow-machine drift: on a 1 MHz 6502 a full cooperative pass costs
    // real milliseconds, so every completed wait re-arms a little late and
    // the lag ACCUMULATES with elapsed time (measured ~9 ms/s on the
    // EATER6502 machine under cc65 -O). The referee's passes are free. A
    // per-device rate budget covers it; order and levels stay exact, so a
    // wrong program cannot hide inside the allowance.
    const driftPerSec = opts.driftPerSecMs ?? 0;
    // Startup latency: reset -> runtime init (zero BSS, copy DATA) -> main.
    // A one-time flat offset, not a rate: the cc65 EATER6502 build reaches
    // main ~8 ms after reset at 1 MHz; gcc cores in the tens of microseconds.
    const startup = opts.startupMs ?? 0;
    const bytesBefore = (t) => (ref.serial ?? [])
        .filter((sLine) => sLine.tMs < t)
        .reduce((a, sLine) => a + String(sLine.line).length + 2, 0);
    const tolAt = (t) => tolMs + startup + bytesBefore(t) * msPerByte + (t / 1000) * driftPerSec;
    const diffs = [];
    const horizon = Math.min(ref.horizon ?? Infinity, actual.horizon ?? Infinity);
    const inWindow = (e) => e.tMs < horizon;

    // Per-PIN streams: cross-pin order within the same millisecond is
    // scheduler-arbitrary (two tasks toggling two pins "at" t=0 may
    // interleave either way), so the global event order proves nothing —
    // each pin's own sequence is the semantics. Leading level-0 events
    // are dropped on BOTH sides: pins implicitly start at intent 0, so a
    // recorded OFF before any ON carries no information (the C build's
    // bw_setup baseline, or a program whose first act is 'turn off').
    const byPin = (events) => {
        const m = new Map();
        for (const e of events.filter(inWindow)) {
            if (!m.has(e.pin)) m.set(e.pin, []);
            m.get(e.pin).push(e);
        }
        for (const [, list] of m) {
            while (list.length && list[0].level === 0) list.shift();
        }
        return m;
    };
    const rm = byPin(ref.events);
    const am = byPin(actual.events);
    for (const pin of new Set([...rm.keys(), ...am.keys()])) {
        const re = rm.get(pin) ?? [];
        const ae = am.get(pin) ?? [];
        const n = Math.min(re.length, ae.length);
        for (let i = 0; i < n; i++) {
            if (re[i].level !== ae[i].level) {
                diffs.push(`${pin}[${i}]: referee level ${re[i].level}@${re[i].tMs}, actual ${ae[i].level}@${ae[i].tMs}`);
            } else if (Math.abs(re[i].tMs - ae[i].tMs) > tolAt(re[i].tMs)) {
                diffs.push(`${pin}[${i}] (level ${re[i].level}): time ${re[i].tMs} vs ${ae[i].tMs}`);
            }
        }
        const extraRef = re.slice(n).filter((e) => e.tMs < horizon - tolMs);
        const extraAct = ae.slice(n).filter((e) => e.tMs < horizon - tolMs);
        if (extraRef.length) diffs.push(`${pin}: referee has ${extraRef.length} events the actual lacks (first: ${JSON.stringify(extraRef[0])})`);
        if (extraAct.length) diffs.push(`${pin}: actual has ${extraAct.length} events the referee lacks (first: ${JSON.stringify(extraAct[0])})`);
    }

    const rs = (ref.serial ?? []).filter(inWindow);
    const as_ = (actual.serial ?? []).filter(inWindow);
    const m = Math.min(rs.length, as_.length);
    for (let i = 0; i < m; i++) {
        if (String(rs[i].line) !== String(as_[i].line)) {
            diffs.push(`serial ${i}: "${rs[i].line}" vs "${as_[i].line}"`);
        } else if (Math.abs(rs[i].tMs - as_[i].tMs) > tolAt(rs[i].tMs)) {
            diffs.push(`serial ${i} ("${rs[i].line}"): time ${rs[i].tMs} vs ${as_[i].tMs}`);
        }
    }
    if (rs.length !== as_.length &&
        Math.abs(rs.length - as_.length) > 0 &&
        !(Math.abs(rs.length - as_.length) === 1 &&
          Math.max(rs[rs.length - 1]?.tMs ?? 0, as_[as_.length - 1]?.tMs ?? 0) >= horizon - tolMs)) {
        diffs.push(`serial count: referee ${rs.length} vs actual ${as_.length}`);
    }

    const rp = ref.pwm ?? [], ap = actual.pwm ?? [];
    for (let i = 0; i < Math.min(rp.length, ap.length); i++) {
        if (rp[i].pin !== ap[i].pin || Math.abs(rp[i].percent - ap[i].percent) > 2) {
            diffs.push(`pwm ${i}: ${JSON.stringify(rp[i])} vs ${JSON.stringify(ap[i])}`);
        }
    }

    // Tone events: pin + frequency, ±5 Hz tolerance (timer resolution).
    const rt = ref.tones ?? [], at_ = actual.tones ?? [];
    for (let i = 0; i < Math.min(rt.length, at_.length); i++) {
        if (rt[i].pin !== at_[i].pin) {
            diffs.push(`tone ${i}: pin "${rt[i].pin}" vs "${at_[i].pin}"`);
        } else if (Math.abs(rt[i].hz - at_[i].hz) > 5) {
            diffs.push(`tone ${i} ("${rt[i].pin}"): ${rt[i].hz} Hz vs ${at_[i].hz} Hz`);
        } else if (Math.abs(rt[i].tMs - at_[i].tMs) > tolAt(rt[i].tMs)) {
            diffs.push(`tone ${i} ("${rt[i].pin}"): time ${rt[i].tMs} vs ${at_[i].tMs}`);
        }
    }
    if (rt.length !== at_.length) {
        diffs.push(`tone count: referee ${rt.length} vs actual ${at_.length}`);
    }

    // Device events: servo angle, motor speed/direction, shift_out value.
    // Compared by kind+name sequence within tolerance, same rules as serial.
    const rd = (ref.devices ?? []).filter(inWindow);
    const ad = (actual.devices ?? []).filter(inWindow);
    const md = Math.min(rd.length, ad.length);
    for (let i = 0; i < md; i++) {
        if (rd[i].kind !== ad[i].kind || rd[i].name !== ad[i].name) {
            diffs.push(`device ${i}: ${JSON.stringify(rd[i])} vs ${JSON.stringify(ad[i])}`);
        } else {
            // Kind-specific value comparison
            const rde = rd[i], ade = ad[i];
            if (rde.kind === 'servo' && rde.angle !== ade.angle) {
                diffs.push(`device ${i} servo "${rde.name}": angle ${rde.angle} vs ${ade.angle}`);
            } else if (rde.kind === 'motor_speed' && rde.speed !== ade.speed) {
                diffs.push(`device ${i} motor "${rde.name}": speed ${rde.speed} vs ${ade.speed}`);
            } else if (rde.kind === 'motor_dir' && rde.dir !== ade.dir) {
                diffs.push(`device ${i} motor "${rde.name}": dir ${rde.dir} vs ${ade.dir}`);
            } else if (rde.kind === 'shift_out' && rde.value !== ade.value) {
                diffs.push(`device ${i} shift_out "${rde.name}": value ${rde.value} vs ${ade.value}`);
            }
            if (Math.abs(rde.tMs - ade.tMs) > tolAt(rde.tMs)) {
                diffs.push(`device ${i} ${rde.kind} "${rde.name}": time ${rde.tMs} vs ${ade.tMs}`);
            }
        }
    }
    if (rd.length !== ad.length) {
        const extra = rd.length > ad.length ? 'referee' : 'actual';
        const diff = Math.abs(rd.length - ad.length);
        diffs.push(`device count: referee ${rd.length} vs actual ${ad.length} (${extra} has ${diff} extra)`);
    }

    return { ok: diffs.length === 0, diffs };
}
