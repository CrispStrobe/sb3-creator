/**
 * Absolute-physics assertions: machine-checkable values in EXPECTED.md.
 *
 * An EXPECTED.md can carry a fenced block:
 *
 *     ```assert
 *     net <label> V <expected> +-<tolerance>
 *     pin <name> duty <expected> +-<tolerance>
 *     current <partId> mA <expected> +-<tolerance>
 *     ```
 *
 * This test parses every such block and checks the assertion against a
 * headless engine solve. Unknown assertion kinds are explicitly skipped
 * with a note — never a silent pass.
 *
 * Run: BW_BOARD=/path/to/bw-board node --test test/assert-physics.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

// ---- engine setup (same pattern as gallery-e2e) ----
import { requireSiblings, siblingGuardTest } from './helpers/siblings.mjs';

// Cross-repo guard: local skip, CI failure. See test/helpers/siblings.mjs.
//
// This file used to resolve the siblings ITSELF, with a findRepo() that threw
// when an explicitly set BW_BOARD/BW_CIRCUIT_UI did not resolve. The RULE was
// right and is kept — an explicit pointer is authoritative, and falling back to
// `../bw-board` silently measures a checkout nobody asked for — but locate() in
// the shared helper already implements exactly that rule ("an explicit env
// pointer WINS ABSOLUTELY — there is no fallback behind it"), and implements it
// with the disposition this file was overriding: absent siblings SKIP on a
// developer box and FAIL in CI.
//
// Throwing at module scope pre-empted that choice, so a local run with a stale
// BW_BOARD was a hard error where the contract says skip. The mutation prover
// caught it as two MISSes ("the same run on a developer box (CI unset) skips
// instead of failing" and "the BW_ALLOW_MISSING_SIBLINGS opt-out still works in
// CI"), both of which point BW_BOARD at a path that does not exist and require
// green. A gate rolling its own skip is the defect this suite has a dedicated
// mutation for; this file was quietly an instance of it.
const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the absolute-physics assertions');
const toUrl = (p) => p && pathToFileURL(p.endsWith('/') ? p : p + '/');
const BOARD_URL = toUrl(gate.paths['bw-board']);
const CUI_URL = toUrl(gate.paths['bw-circuit-ui']);

const ENGINE_SKIP = BOARD_URL && CUI_URL ? false
    : (gate.skip || 'needs bw-board + bw-circuit-ui (set BW_BOARD / BW_CIRCUIT_UI)');

let BoardImpl, Circuit, setEngine, wireEndpoint;
if (!ENGINE_SKIP) {
    ({ BoardImpl } = await import(new URL('src/board.js', BOARD_URL).href));
    const { inferNetlist, checkWiring } = await import(new URL('src/infer-netlist.js', BOARD_URL).href);
    ({ Circuit } = await import(new URL('src/model/circuit.js', CUI_URL).href));
    ({ setEngine } = await import(new URL('src/engine.js', CUI_URL).href));
    ({ wireEndpoint } = await import(new URL('src/model/wire-endpoints.js', CUI_URL).href));
    // Register EVERY device model. Hand-listing four of them is how this test
    // spent months reporting "no circuit file" for circuits that were present
    // and fine: a 555, a 74HC00 or an SSD1306 failed netlist validation as
    // "unknown kind", the board came back empty, and the assertions on it were
    // skipped. src/register-all.js exists precisely for this and its own header
    // documents the same bug found in the designer UI on 2026-08-10.
    const { registerAllDevices } = await import(new URL('src/register-all.js', BOARD_URL).href);
    registerAllDevices();
    // getDevice MUST be injected: without it bw-circuit-ui's terminalsForKind
    // cannot consult the engine and falls back to sidecar -> switch -> ['a','b'],
    // so a battery_aa arrives at validateNetlist claiming terminals a/b against
    // an engine that has pos/neg, and the whole netlist is rejected. Injecting
    // only the three original keys is documented there as "exactly the old
    // resolution order" — which is the order that produces empty boards.
    const { getDevice } = await import(new URL('src/devices.js', BOARD_URL).href);
    setEngine({ BoardImpl, inferNetlist, checkWiring, getDevice });
}

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
// Only truly visual-only parts — breadboard is a connection fabric that
// Circuit.fromJSON needs to resolve seats and holeWires.
const VISUAL_ONLY = new Set(['label', 'wire_jumper']);

// ---- assertion parser ----

/**
 * Parse ```assert blocks from EXPECTED.md.
 * Returns [{kind, args, raw}] where kind is 'net'|'pin'|'current'|unknown.
 */
function parseAssertions(mdText) {
    const assertions = [];
    const re = /```assert\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(mdText)) !== null) {
        for (const line of m[1].split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // net <label> V <value> +-<tol>
            const netMatch = trimmed.match(/^net\s+(\S+)\s+[Vv]\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (netMatch) {
                assertions.push({
                    kind: 'net', label: netMatch[1],
                    unit: 'V', expected: parseFloat(netMatch[2]),
                    tolerance: parseFloat(netMatch[3]), raw: trimmed
                });
                continue;
            }

            // net <label> mV <value> +-<tol>
            const netMvMatch = trimmed.match(/^net\s+(\S+)\s+mV\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (netMvMatch) {
                assertions.push({
                    kind: 'net', label: netMvMatch[1],
                    unit: 'V', expected: parseFloat(netMvMatch[2]) / 1000,
                    tolerance: parseFloat(netMvMatch[3]) / 1000, raw: trimmed
                });
                continue;
            }

            // pin <name> duty <value> +-<tol>
            const pinMatch = trimmed.match(/^pin\s+(\S+)\s+duty\s+~?([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (pinMatch) {
                assertions.push({
                    kind: 'pin-duty', pin: pinMatch[1],
                    expected: parseFloat(pinMatch[2]),
                    tolerance: parseFloat(pinMatch[3]), raw: trimmed
                });
                continue;
            }

            // current <partId> mA <value> +-<tol>
            const curMatch = trimmed.match(/^current\s+(\S+)\s+mA\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (curMatch) {
                assertions.push({
                    kind: 'current', partId: curMatch[1],
                    expected: parseFloat(curMatch[2]),
                    tolerance: parseFloat(curMatch[3]), raw: trimmed
                });
                continue;
            }

            // frequency <label> Hz <value> +-<tol>
            const freqMatch = trimmed.match(/^frequency\s+(\S+)\s+Hz\s+([\d.]+)\s*\+-\s*([\d.]+)$/);
            if (freqMatch) {
                assertions.push({
                    kind: 'frequency', label: freqMatch[1],
                    expected: parseFloat(freqMatch[2]),
                    tolerance: parseFloat(freqMatch[3]), raw: trimmed
                });
                continue;
            }

            // refresh_ms / tick_ms: <value> [+- <tol>] | [+- <n>%]
            //
            // These are PROGRAM-LOOP periods, not circuit quantities: the
            // interval at which the FOREVER loop repeats, which is the `wait`
            // inside it. Checking them cross-checks the shipped documentation
            // against the shipped program, which is a real drift class — a
            // waveform bench once declared 100 Hz in its circuit and ran at
            // 1000.1 Hz, and its EXPECTED.md predicted a voltage that bench
            // could not produce.
            const periodMatch = trimmed.match(
                /^(refresh_ms|tick_ms)\s*:\s*([\d.]+)\s*(?:(?:\+-|±)\s*([\d.]+)(%?))?$/);
            if (periodMatch) {
                const expected = parseFloat(periodMatch[2]);
                const rawTol = periodMatch[3] === undefined ? null : parseFloat(periodMatch[3]);
                assertions.push({
                    kind: 'loop-period', key: periodMatch[1], expected,
                    // No stated tolerance means exact: the program either waits
                    // that long or the document is wrong.
                    tolerance: rawTol === null ? 0
                        : (periodMatch[4] === '%' ? expected * rawTol / 100 : rawTol),
                    raw: trimmed
                });
                continue;
            }

            // pulse_duration_ms: <value> [+- <tol>[%]]
            //
            // A 555 in monostable: t = 1.1 * R * C, where R and C are found by
            // TOPOLOGY, never by name or magnitude. Every one of these circuits
            // carries three resistors, so "the big one" would be a guess that
            // happens to work until it does not.
            const pulseMatch = trimmed.match(
                /^pulse_duration_ms\s*:\s*([\d.]+)\s*(?:(?:\+-|±)\s*([\d.]+)(%?))?$/);
            if (pulseMatch) {
                const expected = parseFloat(pulseMatch[1]);
                const rawTol = pulseMatch[2] === undefined ? null : parseFloat(pulseMatch[2]);
                assertions.push({
                    kind: 'pulse-555', expected,
                    tolerance: rawTol === null ? expected * 0.02
                        : (pulseMatch[3] === '%' ? expected * rawTol / 100 : rawTol),
                    raw: trimmed
                });
                continue;
            }

            // buzzer_tone_hz: <value> [+- <tol>[%]] — a 555 astable's frequency
            const toneMatch = trimmed.match(
                /^buzzer_tone_hz\s*:\s*([\d.]+)\s*(?:(?:\+-|±)\s*([\d.]+)(%?))?$/);
            if (toneMatch) {
                const expected = parseFloat(toneMatch[1]);
                const rawTol = toneMatch[2] === undefined ? null : parseFloat(toneMatch[2]);
                assertions.push({
                    kind: 'tone-555', expected,
                    tolerance: rawTol === null ? expected * 0.02
                        : (toneMatch[3] === '%' ? expected * rawTol / 100 : rawTol),
                    raw: trimmed
                });
                continue;
            }

            // display: <kind> [(<chip>)]   |   interface: i2c|spi|parallel
            const dispMatch = trimmed.match(/^display\s*:\s*(.+)$/);
            if (dispMatch) {
                assertions.push({ kind: 'display-kind', claim: dispMatch[1].trim(), raw: trimmed });
                continue;
            }
            const ifMatch = trimmed.match(/^interface\s*:\s*(i2c|spi|parallel)\s*$/i);
            if (ifMatch) {
                assertions.push({ kind: 'display-bus', bus: ifMatch[1].toLowerCase(), raw: trimmed });
                continue;
            }

            // Unknown assertion kind — explicit skip
            assertions.push({ kind: 'unknown', raw: trimmed });
        }
    }
    return assertions;
}

/**
 * The period of a program's repeating loop, in ms, or a reason it cannot be read.
 *
 * This is deliberately a STATIC read of `wait <n> seconds` inside the program,
 * not a measurement of the running VM. It answers "does the shipped document
 * agree with the shipped program", which is the drift this catches. It does NOT
 * prove the scheduler honours the wait — that is the execution gate's job, and
 * saying so here keeps the two claims apart.
 */
function loopPeriodMs(exampleName) {
    const prog = join(EXAMPLES, exampleName, "program.bw");
    if (!existsSync(prog)) return { ok: false, reason: 'no program.bw' };
    const src = readFileSync(prog, 'utf8');
    const waits = [...src.matchAll(/^\s*wait\s+([\d.]+)\s+seconds?\s*$/gim)]
        .map(m => Math.round(parseFloat(m[1]) * 1000));
    if (waits.length === 0) return { ok: false, reason: 'program has no `wait <n> seconds`' };
    const distinct = [...new Set(waits)];
    // More than one distinct wait means the period is ambiguous. Report that
    // rather than picking one and pretending — a wrong reading here would be
    // indistinguishable from a passing check.
    if (distinct.length > 1) {
        return { ok: false, reason: `ambiguous: ${distinct.length} distinct waits (${distinct.join(', ')} ms)` };
    }
    return { ok: true, ms: distinct[0] };
}

/**
 * The RC time constant of a 555 wired as a monostable, read from TOPOLOGY.
 *
 * The 555 monostable is R from the supply to THRESHOLD, and C from THRESHOLD to
 * ground; the output pulse is t = 1.1 * R * C. Both parts are identified by
 * where they are wired, not by id or by being the largest — pc47 carries a 10k
 * pull-up, a 100k timing resistor and a 1k LED resistor, and picking by
 * magnitude would be a guess that survives only until someone adds a bigger one.
 *
 * Returns {ok:true, ms} or {ok:false, reason}. Never guesses: an unrecognised
 * topology is reported, because a wrong reading here would be indistinguishable
 * from a passing check.
 */
/**
 * The oscillation frequency of a 555 wired as an astable, read from TOPOLOGY.
 *
 *   f = 1.44 / ((R1 + 2*R2) * C)
 *
 * R1 runs supply -> DISCHARGE, R2 runs DISCHARGE -> THRESHOLD, C runs
 * THRESHOLD -> ground. The astable is told apart from the monostable by that
 * middle resistor: a monostable ties DISCHARGE and THRESHOLD to one net, an
 * astable separates them with R2. So the two readers cannot be confused for
 * each other by accident, which matters because both appear in this corpus.
 *
 * Returns {ok:true, hz, ...} or {ok:false, reason}. Never guesses.
 */
function astable555Hz(circuit) {
    const parts = circuit.parts || [];
    const timer = parts.find(p => /555/i.test(String(p.kind || '')));
    if (!timer) return { ok: false, reason: 'no 555 in the circuit' };

    const nets = circuit.resolvedNets || [];
    if (!nets.length) return { ok: false, reason: 'circuit resolved to no nets' };
    const terms = (net) => (net.terminals || net.members || net);
    const idOf = (t) => typeof t === 'string' ? t.split(':')[0] : (t && (t.part || t.partId));
    const trmOf = (t) => typeof t === 'string' ? t.split(':')[1] : (t && t.terminal);
    const netOf = (partId, terminal) => {
        for (let i = 0; i < nets.length; i++)
            for (const t of terms(nets[i]))
                if (idOf(t) === partId && String(trmOf(t)) === terminal) return i;
        return -1;
    };

    const dis = netOf(timer.id, 'discharge');
    const thr = netOf(timer.id, 'threshold');
    if (dis < 0 || thr < 0) return { ok: false, reason: 'DISCHARGE or THRESHOLD is not wired' };
    if (dis === thr) return { ok: false, reason: 'DISCHARGE and THRESHOLD share a net — that is a monostable, not an astable' };

    const kindOf = new Map(parts.map(p => [p.id, String(p.kind || '')]));
    const supplyNets = new Set(), groundNets = new Set();
    nets.forEach((net, i) => {
        for (const t of terms(net)) {
            const k = kindOf.get(idOf(t)) || '';
            if (/^(vcc|vdd|v\+|supply)$/i.test(k)) supplyNets.add(i);
            if (/^(gnd|ground|vss)$/i.test(k)) groundNets.add(i);
        }
    });

    const legs = (p) => ['a', 'b'].map(t => netOf(p.id, t));
    const res = parts.filter(p => /resistor/i.test(String(p.kind || '')));
    // R1 runs supply -> DISCHARGE, but the supply may be GATED: pc75-alarmgeber
    // is an alarm, so its rail reaches R1 through a button. One hop through a
    // two-terminal SWITCHING element counts; a hop through anything else does
    // not, because "any path to the supply" would match half the circuit and
    // stop being a topology check at all.
    const SWITCHING = /^(button|switch|spst|spdt|toggle|relay|reed|pushbutton)$/i;
    const supplyish = new Set(supplyNets);
    for (const p of parts) {
        if (!SWITCHING.test(String(p.kind || ''))) continue;
        const [a, b] = legs(p);
        if (a >= 0 && b >= 0) {
            if (supplyNets.has(a)) supplyish.add(b);
            if (supplyNets.has(b)) supplyish.add(a);
        }
    }
    const r1 = res.find(p => { const [a, b] = legs(p);
        return (a === dis && supplyish.has(b)) || (b === dis && supplyish.has(a)); });
    if (!r1) return { ok: false, reason: 'no resistor from the supply to DISCHARGE (R1), even through a switch' };
    const r2 = res.find(p => { const [a, b] = legs(p);
        return (a === dis && b === thr) || (b === dis && a === thr); });
    if (!r2) return { ok: false, reason: 'no resistor between DISCHARGE and THRESHOLD (R2)' };
    const c = parts.filter(p => /capacitor/i.test(String(p.kind || '')))
        .find(p => { const [a, b] = legs(p);
            return (a === thr && groundNets.has(b)) || (b === thr && groundNets.has(a)); });
    if (!c) return { ok: false, reason: 'no capacitor from THRESHOLD to ground' };

    const R1 = Number(r1.params?.ohms), R2 = Number(r2.params?.ohms), C = Number(c.params?.farads);
    if (!(R1 > 0) || !(R2 > 0) || !(C > 0))
        return { ok: false, reason: `R1=${R1} R2=${R2} C=${C} — not usable values` };
    return { ok: true, hz: 1.44 / ((R1 + 2 * R2) * C), r1: r1.id, r2: r2.id, c: c.id, R1, R2, C };
}

function monostable555Ms(circuit) {
    const parts = circuit.parts || [];
    const timer = parts.find(p => /555/i.test(String(p.kind || '')));
    if (!timer) return { ok: false, reason: 'no 555 in the circuit' };

    const nets = circuit.resolvedNets || [];
    if (!nets.length) return { ok: false, reason: 'circuit resolved to no nets' };
    const netOf = (partId, terminal) => {
        for (let i = 0; i < nets.length; i++) {
            for (const t of (nets[i].terminals || nets[i].members || nets[i])) {
                const pid = typeof t === 'string' ? t.split(':')[0] : (t && (t.part || t.partId));
                const trm = typeof t === 'string' ? t.split(':')[1] : (t && t.terminal);
                if (pid === partId && String(trm) === terminal) return i;
            }
        }
        return -1;
    };

    const thr = netOf(timer.id, 'threshold');
    if (thr < 0) return { ok: false, reason: `555 ${timer.id} has no wired threshold pin` };

    const kindOf = new Map(parts.map(p => [p.id, String(p.kind || '')]));
    const supplyNets = new Set(), groundNets = new Set();
    nets.forEach((net, i) => {
        for (const t of (net.terminals || net.members || net)) {
            const pid = typeof t === 'string' ? t.split(':')[0] : (t && (t.part || t.partId));
            const k = kindOf.get(pid) || '';
            if (/^(vcc|vdd|v\+|supply)$/i.test(k)) supplyNets.add(i);
            if (/^(gnd|ground|vss)$/i.test(k)) groundNets.add(i);
        }
    });

    // R: one leg on THRESHOLD, the other on a supply net.
    const legs = (p) => ['a', 'b'].map(t => netOf(p.id, t));
    const rt = parts.filter(p => /resistor/i.test(String(p.kind || '')))
        .find(p => { const [a, b] = legs(p);
            return (a === thr && supplyNets.has(b)) || (b === thr && supplyNets.has(a)); });
    if (!rt) return { ok: false, reason: 'no resistor from the supply to THRESHOLD' };

    // C: one leg on THRESHOLD, the other on ground.
    const ct = parts.filter(p => /capacitor/i.test(String(p.kind || '')))
        .find(p => { const [a, b] = legs(p);
            return (a === thr && groundNets.has(b)) || (b === thr && groundNets.has(a)); });
    if (!ct) return { ok: false, reason: 'no capacitor from THRESHOLD to ground' };

    const ohms = Number(rt.params?.ohms);
    const farads = Number(ct.params?.farads);
    if (!(ohms > 0) || !(farads > 0)) {
        return { ok: false, reason: `${rt.id}=${ohms}ohm ${ct.id}=${farads}F — not usable values` };
    }
    return { ok: true, ms: 1.1 * ohms * farads * 1000, r: rt.id, c: ct.id, ohms, farads };
}

/**
 * Structural display claims: which controller a bench carries, and over which bus.
 *
 * `display:` and `interface:` are properties of the CIRCUIT, so they are read
 * from the netlist rather than by running anything. They catch a documentation
 * class the electrical assertions cannot: an intro promising an SSD1306 over
 * I2C for a bench that carries something else, or nothing.
 *
 * ONE alias family, and it earns its place rather than being a loosening:
 * a claim of `hd44780` against a part of kind `char_lcd_i2c` is CORRECT — that
 * part is an HD44780 behind an I2C backpack, and the lesson is teaching the
 * controller. Everything else in the corpus matches exactly, including the
 * "friendly (chip)" forms like `mono_lcd (ssd1306)` and `neopixel (ws2812)`,
 * where either token may be the one that matches.
 */
const DISPLAY_ALIASES = new Map([
    ['hd44780', ['char_lcd', 'char_lcd_i2c']],
]);

function displayKinds(circuit) {
    return (circuit.parts || []).map(p => String(p.kind || '').toLowerCase());
}

/** Candidate tokens in a claim: the bare words and anything parenthesised. */
function claimTokens(raw) {
    return [...new Set(String(raw).toLowerCase().match(/[a-z0-9_]+/g) || [])];
}

/** The bus a part is wired for, from the terminals that actually carry nets. */
function busOf(circuit, partId) {
    const wired = new Set();
    for (const net of (circuit.resolvedNets || [])) {
        for (const t of (net.terminals || net.members || net)) {
            const pid = typeof t === 'string' ? t.split(':')[0] : (t && (t.part || t.partId));
            const trm = typeof t === 'string' ? t.split(':')[1] : (t && t.terminal);
            if (pid === partId && trm) wired.add(String(trm).toLowerCase());
        }
    }
    if (wired.has('sda') && wired.has('scl')) return 'i2c';
    if ([...wired].some(t => /^(mosi|miso|sck|clk|din|cs|load)$/.test(t))) return 'spi';
    if ([...wired].some(t => /^d[0-7]$/.test(t)) && (wired.has('rs') || wired.has('e'))) return 'parallel';
    return null;
}

// ---- circuit solver ----

// Index-based circuit file lookup (same contract as gallery-e2e)
const _idx = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const _byDir = new Map(_idx.map(e => [e.files?.program?.split('/')[0] ?? e.id, e]));
function findCircuitFile(name) {
    // 1. Direct circuit.json
    const direct = join(EXAMPLES, name, 'circuit.json');
    if (existsSync(direct)) return direct;
    // 2. Index-referenced authored circuit
    const entry = _byDir.get(name);
    if (entry?.files?.circuit) return join(EXAMPLES, entry.files.circuit);
    return null;
}

/**
 * Solve a circuit, or explain precisely why it cannot be solved.
 * Returns {ok:true, ...} or {ok:false, reason}. The old contract returned
 * bare null for THREE different causes and the caller printed "no circuit
 * file" for all of them, which hid a registry bug for months.
 */
function solveCircuit(name, atMs = 1) {
    const circuitPath = findCircuitFile(name);
    if (!circuitPath) return { ok: false, reason: `no circuit file for "${name}"` };
    const data = JSON.parse(readFileSync(circuitPath, 'utf8'));

    // Filter visual-only
    const visualIds = new Set(data.parts.filter(p => VISUAL_ONLY.has(p.kind)).map(p => p.id));
    data.parts = data.parts.filter(p => !VISUAL_ONLY.has(p.kind));
    // Through the ONE canonical dialect reader. Keying on `typeof w.from ===
    // 'string'` saw only the flat dialect, so every NESTED wire to a
    // visual-only part survived the filter that had just removed the part —
    // and 1,039 of the 2,096 shipped circuit files are nested.
    data.wires = (data.wires || []).filter(w =>
        !['from', 'to'].some((side) => {
            const e = wireEndpoint(w, side);
            return e && e.part && visualIds.has(e.part);
        }));

    const circuit = Circuit.fromJSON(data);
    const board = circuit.board;
    // If the board rejected the netlist (missing devices, breadboard fabric
    // the CUI can't resolve), getNets() returns empty — treat as unsolvable.
    const nets = board.getNets?.() || [];
    if (nets.length === 0) {
        return { ok: false, reason: `netlist REJECTED (board empty) for ${circuitPath.slice(circuitPath.indexOf('examples/'))} `
            + `- ${data.parts.length} parts, 0 nets. Usually an unregistered part kind.` };
    }
    board.advanceTo(BigInt(Math.round(atMs * 1_000_000)));

    // Build net label map: for each net, create labels from part.terminal
    // Also register common aliases (vcc1.pos → vcc1.vcc, src.pos → src.vcc, etc.)
    const netLabels = new Map();
    const TERMINAL_ALIASES = {
        'pos': ['vcc', 'pos'],   // vsource uses pos, vcc uses vcc
        'vcc': ['vcc', 'pos'],
        'neg': ['gnd', 'neg'],
        'gnd': ['gnd', 'neg'],
    };
    for (const net of circuit.nets || board.getNets?.() || []) {
        const id = net.id || net.name;
        for (const t of net.terminals || []) {
            const label = `${t.part}.${t.terminal}`;
            netLabels.set(label, id);
            // Register aliases: if terminal is 'vcc', also register 'part.pos'
            const aliases = TERMINAL_ALIASES[t.terminal];
            if (aliases) {
                for (const alt of aliases) {
                    const altLabel = `${t.part}.${alt}`;
                    if (!netLabels.has(altLabel)) netLabels.set(altLabel, id);
                }
            }
            // Also store by just part id if it's a simple part
            if (!netLabels.has(t.part)) netLabels.set(t.part, id);
        }
    }

    return { ok: true, board, circuit, netLabels, circuitPath };
}

// ---- known defects (RATCHET: only ever shrinks) ----

/**
 * Assertions that are CHECKED and FAIL. Each entry names which side is wrong
 * and why, because "the check went red" is not a finding on its own.
 *
 * These are not tolerated failures — they are unfixed defects with a verdict
 * recorded. Deliberately NOT fixed by editing the claim to match the engine:
 * that would turn a test into a tautology. The claim stays as authored until
 * someone fixes the side that is actually wrong.
 *
 * Key: `${example}::${raw assertion line}`.
 */
const KNOWN_DEFECTS = new Map([
    // --- CLAIM is wrong: a Pi Pico's rail is 3.3 V, not 5 V. ------------------
    // The corpus refutes these three itself: pico02-pot-print, pico03-two-tasks
    // and pico04-button carry `net vcc1.vcc V 3.30` on the same part and pass.
    // Same rail, same kind, contradictory claims. Fix = correct the claim to
    // 3.30 (a real fix, not a snapshot — 3.3 V is what a Pico's 3V3 pin is).
    ['70-calculator::net vcc1.vcc V 5.00 +-0.01',
        'CLAIM wrong: pi_pico rail is 3.3 V; engine reads 3.3000'],
    ['70-calculator-simple::net vcc1.vcc V 5.00 +-0.01',
        'CLAIM wrong: pi_pico rail is 3.3 V; engine reads 3.3000'],
    ['72-pico-oled-hello::net vcc1.vcc V 5.00 +-0.01',
        'CLAIM wrong: pi_pico rail is 3.3 V; engine reads 3.3000'],

    // --- CLAIM is wrong: assumes a midpoint pot the circuit does not declare.
    // contrast has params.position = 0.15 across a 5 V rail -> 0.75 V, which is
    // exactly what the engine reads, and 0.15 is deliberate: an HD44780 contrast
    // pot belongs near the bottom of its range. The claim assumed position 0.5.
    ['eater6502-full-build::net contrast.wiper V 2.50 +-0.05',
        'CLAIM wrong: pot position=0.15 -> 0.75 V; claim assumes a midpoint pot'],
    // vsrc1 has params.position = 0.6 -> 3.0 V unloaded, 2.83 V once rv1 loads
    // the wiper. The claim of 2.5 V matches neither, and contradicts the
    // circuit's own declared position.
    ['76-multimeter::net vsrc1.wiper V 2.50 +-0.05',
        'CLAIM wrong: pot position=0.6 -> 2.83 V loaded; claim assumes position 0.5'],

    // --- CIRCUIT is wrong, and here the claim is the correct side. -----------
    // The last entry of this kind — pc84-led-herz's shorted supply rail — was
    // REPAIRED on 2026-08-23 rather than tolerated, and is therefore gone from
    // this map. `net_12` was one netId spanning TWO electrically separate
    // nodes: wire_9 and wire_fix_1048 put vcc_1.vcc and lm358_3.vcc on it while
    // ten more wires put gnd_2.gnd, five LED cathodes and the integrator cap on
    // the same label. The netlist groups BY netId, so the rail sat at 0 V and
    // the LM358 ran with no supply. Splitting the label (largest component
    // keeps the id) moved two wires and nothing else; `net vcc_1.pos V 5.00`
    // now reads 5.0000 and passes on its own merits. The claim was right all
    // along, which is what "CIRCUIT wrong" was always saying.
]);

/** Keys actually encountered this run — guards against a stale entry. */
const DEFECTS_SEEN = new Set();

// ---- collect examples with assert blocks ----

const allExamples = readdirSync(EXAMPLES).filter(d => {
    if (d === 'AUDIT') return false;
    try { return statSync(join(EXAMPLES, d)).isDirectory(); } catch { return false; }
}).sort();

const examplesWithAssertions = [];
for (const name of allExamples) {
    const expPath = join(EXAMPLES, name, 'EXPECTED.md');
    if (!existsSync(expPath)) continue;
    const text = readFileSync(expPath, 'utf8');
    const assertions = parseAssertions(text);
    if (assertions.length > 0) {
        examplesWithAssertions.push({ name, assertions });
    }
}

// ---- tests ----

describe('absolute-physics assertions', { skip: ENGINE_SKIP }, () => {
    if (examplesWithAssertions.length === 0) {
        test('no assert blocks found yet (seed examples needed)', () => {
            // Not a failure — just no assertions to check yet
        });
        return;
    }

    for (const { name, assertions } of examplesWithAssertions) {
        describe(`${name}`, () => {
            let solved;
            try { solved = solveCircuit(name); }
            catch (e) { solved = { ok: false, reason: `threw: ${e.message?.split('\n')[0] || String(e)}` }; }

            // A circuit that will not solve is a DEFECT, not an absence. An
            // ```assert net ...``` line is a claim its author made about a
            // circuit they believed exists; if we cannot solve it, the claim
            // is unverified and must say so in red.
            const circuitFail = solved.ok ? null : `circuit ${name} not solvable: ${solved.reason}`;

            for (const a of assertions) {
                if (a.kind === 'unknown') {
                    test(`SKIP unknown assertion: ${a.raw}`, { skip: `unknown assertion kind: "${a.raw}"` }, () => {});
                    continue;
                }

                if (a.kind === 'loop-period') {
                    test(`${a.key} = ${a.expected} ms +-${a.tolerance}`, () => {
                        const p = loopPeriodMs(name);
                        // Unreadable is a FAILURE, not a skip: the document
                        // makes a claim about a program, so if the program
                        // cannot be read the claim is unverified.
                        assert.ok(p.ok, `${name}: cannot read the loop period — ${p.reason}`);
                        const delta = Math.abs(p.ms - a.expected);
                        assert.ok(delta <= a.tolerance,
                            `${a.key} claims ${a.expected} ms +-${a.tolerance}, but the program waits ` +
                            `${p.ms} ms (off by ${delta}). Either the program changed and EXPECTED.md ` +
                            `was not updated, or the claim was wrong when written.`);
                    });
                    continue;
                }

                if (a.kind === 'tone-555') {
                    test(`buzzer_tone_hz = ${a.expected} +-${a.tolerance.toFixed(2)} (1.44/((R1+2R2)C))`, () => {
                        assert.ok(!circuitFail, circuitFail);
                        const f = astable555Hz(solved.circuit);
                        assert.ok(f.ok, `${name}: cannot read the 555 astable network — ${f.reason}`);
                        const delta = Math.abs(f.hz - a.expected);
                        assert.ok(delta <= a.tolerance,
                            `buzzer_tone_hz claims ${a.expected} Hz, but 1.44/((${f.r1}=${f.R1} + 2*${f.r2}=${f.R2}) * ` +
                            `${f.c}=${f.C} F) = ${f.hz.toFixed(2)} Hz (off by ${delta.toFixed(2)})`);
                    });
                    continue;
                }

                if (a.kind === 'display-kind') {
                    test(`display is ${a.claim}`, () => {
                        assert.ok(!circuitFail, circuitFail);
                        const kinds = displayKinds(solved.circuit);
                        const toks = claimTokens(a.claim);
                        const hit = kinds.some(k => toks.includes(k) ||
                            toks.some(t => (DISPLAY_ALIASES.get(t) || []).includes(k)));
                        assert.ok(hit,
                            `EXPECTED.md says the display is "${a.claim}", but the circuit carries ` +
                            `[${kinds.join(', ')}]`);
                    });
                    continue;
                }

                if (a.kind === 'display-bus') {
                    test(`interface is ${a.bus}`, () => {
                        assert.ok(!circuitFail, circuitFail);
                        const parts = (solved.circuit.parts || [])
                            .filter(p => busOf(solved.circuit, p.id));
                        assert.ok(parts.length,
                            `interface claims ${a.bus}, but no part in the circuit is wired to a ` +
                            `recognisable bus (no sda/scl, no spi pins, no parallel data bus)`);
                        const buses = [...new Set(parts.map(p => busOf(solved.circuit, p.id)))];
                        assert.ok(buses.includes(a.bus),
                            `interface claims ${a.bus}, but the wired bus is ${buses.join('/')}`);
                    });
                    continue;
                }

                if (a.kind === 'pulse-555') {
                    test(`pulse_duration_ms = ${a.expected} +-${Math.round(a.tolerance)} (1.1*R*C)`, () => {
                        assert.ok(!circuitFail, circuitFail);
                        const t = monostable555Ms(solved.circuit);
                        // Unreadable topology is a FAILURE: the document claims
                        // a pulse width for a circuit, so if the circuit does
                        // not present a monostable the claim is unverified.
                        assert.ok(t.ok, `${name}: cannot read the 555 timing network — ${t.reason}`);
                        const delta = Math.abs(t.ms - a.expected);
                        assert.ok(delta <= a.tolerance,
                            `pulse_duration_ms claims ${a.expected} ms, but 1.1 * ${t.r}(${t.ohms} ohm) * ` +
                            `${t.c}(${t.farads} F) = ${t.ms.toFixed(1)} ms (off by ${delta.toFixed(1)})`);
                    });
                    continue;
                }

                if (a.kind === 'net') {
                    const defectKey = `${name}::${a.raw}`;
                    const defect = KNOWN_DEFECTS.get(defectKey);
                    if (defect) DEFECTS_SEEN.add(defectKey);
                    test(`net ${a.label} = ${a.expected} ${a.unit} +-${a.tolerance}`
                        + (defect ? `  [KNOWN DEFECT: ${defect}]` : ''), () => {
                        const check = () => {
                            assert.ok(!circuitFail, circuitFail);
                            const netId = solved.netLabels.get(a.label);
                            assert.ok(netId !== undefined, `net label "${a.label}" not found in circuit`);
                            const measured = solved.board.nodeVoltages.get(netId) ?? NaN;
                            assert.ok(!isNaN(measured), `no voltage for net ${netId}`);
                            const diff = Math.abs(measured - a.expected);
                            assert.ok(diff <= a.tolerance,
                                `${name}: net ${a.label} = ${measured.toFixed(4)} V, ` +
                                `expected ${a.expected} +-${a.tolerance} V (off by ${diff.toFixed(4)})`);
                        };
                        if (!defect) return check();
                        // Ratchet: a known defect must STILL be broken. If it
                        // passes, the defect was fixed and the entry must go —
                        // otherwise the list rots into a permanent excuse.
                        let threw = false;
                        try { check(); } catch { threw = true; }
                        assert.ok(threw,
                            `${defectKey}\n  now PASSES — remove it from KNOWN_DEFECTS in the same commit that fixed it.`);
                    });
                    continue;
                }

                if (a.kind === 'current') {
                    test(`current ${a.partId} = ${a.expected} mA +-${a.tolerance}`, { skip: 'current readback not yet wired' }, () => {});
                    continue;
                }

                if (a.kind === 'pin-duty') {
                    test(`pin ${a.pin} duty = ${a.expected} +-${a.tolerance}`, { skip: 'duty cycle requires multi-step sim' }, () => {});
                    continue;
                }

                if (a.kind === 'frequency') {
                    test(`frequency ${a.label} = ${a.expected} Hz +-${a.tolerance}`, { skip: 'frequency requires oscillation measurement' }, () => {});
                    continue;
                }
            }
        });
    }
});

// A KNOWN_DEFECTS key that no assertion matched is a stale entry: the example
// was renamed or the claim reworded, and the ratchet silently stopped guarding
// anything. That is the same failure shape as the path typo in GATE-AUDIT.
describe('known-defect ratchet integrity', { skip: ENGINE_SKIP }, () => {
    test('every KNOWN_DEFECTS entry matched a real assertion', () => {
        const stale = [...KNOWN_DEFECTS.keys()].filter(k => !DEFECTS_SEEN.has(k));
        assert.deepEqual(stale, [],
            `stale KNOWN_DEFECTS entries (nothing in the corpus matches them):\n  ${stale.join('\n  ')}`);
    });
});

// Export parser for other tests to use
export { parseAssertions };
