/**
 * Routing a claim to the thing that can contradict it.
 *
 * THE FAILURE MODE THIS IS BUILT AGAINST
 * --------------------------------------
 * The naive gate — "does some measurand in this bench equal this number" —
 * marks correct documents wrong. Most numbers in an EXPECTED.md are not about
 * the bench in its authored state: they are about it with the button pressed,
 * the pot at 70 %, the LDR at 10 kΩ, the input swept to 12 V, 100 ms after
 * power-on; or about a bench that deliberately is NOT this one ("far beyond the
 * LED's rated 20 mA", "not the 2.3 mA an unloaded wiper would give"). A gate
 * that compares those against one DC solve produces a long list of confident
 * false accusations, and a long list of false accusations is worse than no
 * gate: it teaches its readers to dismiss it.
 *
 * So every claim is ROUTED first, with three possible outcomes:
 *
 *   an operating point   the claim names a condition this engine can set, so
 *                        the bench is re-solved there and the comparison is
 *                        exact. `controls` reaches BoardImpl.setControl —
 *                        button 1 = pressed, pot = position, vsource = volts,
 *                        LDR = illumination, NTC = temperature — and `atMs`
 *                        reaches advanceTo.
 *   an enumeration       the claim names no condition, so it is held against
 *                        every state the bench can be PUT in. A claim matching
 *                        no reachable state is a real mismatch; one that
 *                        matches is reported with the state that produced it.
 *   a decline            counterfactual prose, a condition the engine has no
 *                        channel for, or a condition LABEL rather than a claim.
 *                        Declines carry their reason and are counted.
 *
 * A RESISTANCE IS A SETTABLE CONDITION
 * ------------------------------------
 * The documents state a light level as "LDR ≈ 10 kΩ" and a temperature as "NTC
 * 20 kΩ", while the engine's control channel takes a 0..1 knob. That looked
 * like an unbridgeable mismatch and was declined as one in the first cut of
 * this gate. It is not: `stampVariableResistor` interpolates GEOMETRICALLY,
 * ohms = rDark·(rLight/rDark)^light, so a stated resistance inverts exactly to
 * the control value that produces it. pc24-light-gate's own table is the proof
 * — it writes "mid (0.5) | 10 kΩ" beside each other, and the inversion returns
 * 0.5 for 10 kΩ against that bench's declared 1 k/100 k span. Thirty-six claims
 * across the LDR and NTC benches move from unverified to checked because of one
 * logarithm.
 *
 * WRONG AND UNVERIFIABLE ARE NOT THE SAME
 * ---------------------------------------
 * A claim the engine contradicts is a defect in the corpus. A claim the engine
 * has no readback for is a gap in the instrument. Both are open; only the first
 * is anybody's fault, and the reasons below are written so the two never merge
 * into a single number.
 */
import { solveBench, declaredPool } from './bench-measure.mjs';
import { programOf, exampleDirs } from './expected-claims.mjs';

const EXAMPLE_DIRS = new Set(exampleDirs().map(d => d.toLowerCase()));

/**
 * Prose whose number is deliberately NOT this bench in this state: a rating, a
 * warning, a road not taken, a Thévenin equivalent, a hand approximation the
 * text goes on to correct. Reading these as claims about the bench is how a
 * gate marks a good document wrong.
 */
const COUNTERFACTUAL = new RegExp([
    // a road not taken
    '\\bwould\\b', '\\bwere\\b', '\\binstead\\b', '\\breplace\\b', '\\bhalve\\b',
    '\\bdouble the\\b', '\\bassume', '\\bsuppose', '\\bimagine', '\\bhypothetical',
    '\\bexperiment\\b', '\\btry\\b', '\\bswap\\b', '\\bselection\\b',
    'without the', '\\bthrough\\s+\\d+\\s*k',
    // a rating or a limit, which is a datasheet fact and not a measurement
    '\\brated\\b', '\\brating\\b', 'absolute maximum', '\\bexceed', 'datasheet',
    'per-port', '\\bnear max\\b', '\\bstall\\b', '\\bthreshold\\b', '\\bv_?be\\s*[=≈]',
    'chip budget', "chip's total", 'per-pin maximum', 'total budget', 'total capacity',
    '\\bresolution\\b', 'per step', 'stands in for', '^\\s*-\\s*\\d+\\s*(?:Ω|k)',
    '\\bat most\\b', '\\bat least\\b', '\\bsinks\\b', 'sources only', '\\bcosts\\b',
    '\\bbelow\\s+~?[\\d.]+\\s*[VmA]', '\\babove\\s+~?[\\d.]+\\s*[VmA]', '\\bmoved\\b',
    // a value the text itself disowns
    '\\bnot the\\b', '\\bnot\\s+(?:the\\s+)?[\\d.]', 'WRONG', '\\bshould be\\b',
    'unloaded', 'approximat', 'model-dependent', '\\bat about\\b', '\\bideal',
    'hand-derived', 'hand-comp', '\\bquoted\\b', '\\bused to\\b', '\\bpreviously\\b',
    'kcl violation',
    // an equivalent circuit, a difference between two sweep points, an extremum
    'looking (back )?into', '\\bequivalent\\b', 'th[ée]venin', '\\bswing\\b',
    'moving from', '\\bat peak\\b', '\\bfar more\\b', '\\bfar less\\b',
].join('|'), 'i');

/** Conditions the engine has no control channel for — named, never guessed at. */
function unsettable (ctx) {
    // A scheduled sequence: charge then discharge, or a source stepped
    // mid-run. The documents write these as an audit-solve invocation, and
    // honouring one means scripting control changes against the clock.
    if (/--set@|--set\s|\bthen\s+(at|close|open)\b|\bstep it\b|\bstepped\b/i.test(ctx))
        return 'the operating point is a SEQUENCE of control changes against the clock (the document states it as an audit-solve --set invocation), and this gate solves at one point rather than scripting a run';

    if (/sound[ _-]?(module|level)|\bAO\b|microphone/i.test(ctx))
        return 'the operating point is a sound level, and no control channel sets one';
    if (/\bpwm\b|duty cycle/i.test(ctx))
        return 'the operating point is a PWM duty cycle, which is a firmware state this gate does not run';
    if (/\bservo\b|\bangle\b/i.test(ctx))
        return 'the operating point is a servo angle, which is a firmware state';
    return null;
}

const toMs = (v, u) => u === 's' ? v * 1000 : u === 'ms' ? v : v / 1000;

/**
 * The control value that puts a variable resistor at a stated resistance.
 * stampVariableResistor interpolates geometrically, so this inverts exactly.
 */
function knobForOhms (part, ohms) {
    const dark = part.kind === 'ldr' ? (part.params?.rDark ?? 1e6) : (part.params?.rCold ?? 1e5);
    const light = part.kind === 'ldr' ? (part.params?.rLight ?? 100) : (part.params?.rHot ?? 1000);
    if (!(dark > 0) || !(light > 0) || dark === light || !(ohms > 0)) return null;
    const k = Math.log(ohms / dark) / Math.log(light / dark);
    return (k >= -0.001 && k <= 1.001) ? Math.min(1, Math.max(0, k)) : null;
}

const OHM_IN = /(-?\d+(?:\.\d+)?)\s*(kΩ|MΩ|Ω|kohms?|ohms?)/i;
const ohmsOf = (m) => parseFloat(m[1]) * (/^k/i.test(m[2]) ? 1e3 : /^M/.test(m[2]) ? 1e6 : 1);

/**
 * Read every operating point a context states, and merge them.
 * @returns {{controls: object, atMs?: number, labels: string[]}}
 */
function readConditions (text, parts) {
    const controls = {};
    const labels = [];
    let atMs;
    const has = (kind) => (parts || []).some(p => p.kind === kind);
    const varRes = (parts || []).filter(p => p.kind === 'ldr' || p.kind === 'ntc');

    const t = text.match(/\b(?:t|time|elapsed)\b[^=|]{0,14}=\s*~?(-?\d+(?:\.\d+)?)\s*(ms|s|µs|us)\b/i)
        || text.match(/\bafter\s+(-?\d+(?:\.\d+)?)\s*(ms|s)\b/i)
        || text.match(/\bat\s+t\s*=\s*~?(-?\d+(?:\.\d+)?)\s*(ms|s|µs|us)\b/i);
    if (t) { atMs = toMs(parseFloat(t[1]), t[2].toLowerCase().replace('us', 'µs')); labels.push(`t = ${t[1]} ${t[2]}`); }

    if (has('potentiometer')) {
        const pos = text.match(/position\s*[=:]?\s*([\d.]+)/i);
        const pct = text.match(/(?:pot|wiper|knob|source pot)[^.|]{0,24}?(\d+)\s*%/i) || text.match(/\bat\s+(\d+)\s*%\s*(?:position)?/i);
        if (pos && parseFloat(pos[1]) <= 1) { controls.potentiometer = parseFloat(pos[1]); labels.push(`pot ${pos[1]}`); }
        else if (pct) { controls.potentiometer = parseInt(pct[1], 10) / 100; labels.push(`pot ${pct[1]} %`); }
        else if (/\bfully\s*(cw|clockwise)\b/i.test(text)) { controls.potentiometer = 1; labels.push('pot fully CW'); }
        else if (/\bfully\s*(ccw|counter)/i.test(text)) { controls.potentiometer = 0; labels.push('pot fully CCW'); }
        else if (/\ball pots at zero|\bat zero\b/i.test(text)) { controls.potentiometer = 0; labels.push('pot at zero'); }
    }

    if (has('button') || has('switch') || has('slide_switch')) {
        if (/\b(pressed|closed|held down|switch closed)\b/i.test(text)) { controls.button = 1; labels.push('closed'); }
        else if (/\b(released|open|switch open|not pressed)\b/i.test(text)) { controls.button = 0; labels.push('open'); }
    }

    for (const p of varRes) {
        const knob = p.kind === 'ldr' ? 'ldr' : 'ntc';
        // "LDR ≈ 10 kΩ", "R_LDR | 100 kΩ", "NTC 10 kΩ (at 25°C)".
        const near = text.match(new RegExp(`(?:${knob}|r_?${knob}|thermistor)[^.|]{0,18}?(-?\\d+(?:\\.\\d+)?)\\s*(kΩ|MΩ|Ω|kohms?|ohms?)`, 'i'))
            || (/^\s*\|/.test(text) ? text.match(OHM_IN) : null);
        if (near) {
            const k = knobForOhms(p, ohmsOf(near));
            if (k !== null) { controls[p.id] = k; labels.push(`${p.id} at ${near[1]} ${near[2]}`); continue; }
        }
        const named = text.match(/\b(dark|bright|light|cold|hot|warm|cool)\s*\(([\d.]+)\)/i);
        if (named) { controls[p.id] = parseFloat(named[2]); labels.push(`${p.id} ${named[1]}`); continue; }
        if (p.kind === 'ldr' && /\bbright\b/i.test(text)) { controls[p.id] = 1; labels.push(`${p.id} bright`); }
        else if (p.kind === 'ldr' && /\bdark\b/i.test(text)) { controls[p.id] = 0; labels.push(`${p.id} dark`); }
    }

    // A named source at a stated voltage: "`src_a` at 9 V", "VCC … to 12 V".
    for (const p of (parts || [])) {
        if (p.kind !== 'vsource' && p.kind !== 'battery') continue;
        const byId = text.match(new RegExp(`\`?${p.id.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\`?[^.|]{0,12}?\\bat\\s+(-?\\d+(?:\\.\\d+)?)\\s*V\\b`, 'i'));
        if (byId) { controls[p.id] = parseFloat(byId[1]); labels.push(`${p.id} at ${byId[1]} V`); }
    }
    const swept = text.match(/from\s+-?[\d.]+\s*V\s+to\s+(-?\d+(?:\.\d+)?)\s*V/i);
    if (swept) {
        if ((parts || []).some(p => p.kind === 'vsource')) controls.vsource = parseFloat(swept[1]);
        else controls.__vcc = parseFloat(swept[1]);
        labels.push(`supply ${swept[1]} V`);
    }
    if ((parts || []).some(p => /^(mcu|arduino_|pi_pico|attiny|atmega|stc\d|w65c|m?6502|z80|esp)/i.test(p.kind || ''))) {
        // "| 0 | high (5 V) | ON | 13.2 mA |" states the pin's drive in a
        // column of its own; the current beside it is a claim about the bench
        // WITH that pin driven, and solving with the pin undriven answers a
        // question nobody asked.
        const drive = text.match(/\b(?:pin|state|output|drive|p[0-9]\.[0-9]|d\d+|gp\d+|pa\d+)\b[^|]{0,24}?=?\s*\b(high|low)\b/i)
            || text.match(/\bpin\s+(?:is\s+)?(high|low)\b/i) || text.match(/\bdriven\s+(high|low)\b/i);
        if (drive) { controls.__pins = drive[1].toLowerCase(); labels.push(`MCU pins ${drive[1].toLowerCase()}`); }
        else if (/\bactive-low\b[^.]{0,40}\b(on|lit)\b/i.test(text)) { controls.__pins = 'low'; labels.push('MCU pins low'); }
    }

    // "At t = τ" and "1 τ": the time constant is the bench's own R x C.
    if (atMs === undefined && /\bt\s*=\s*~?[0-9]*\s*(?:τ|tau)/i.test(text)) {
        const n = (text.match(/([\d.]+)\s*(?:τ|tau)/i) || [null, '1'])[1];
        const caps = (parts || []).filter(p => typeof p.params?.farads === 'number');
        const res = (parts || []).filter(p => typeof p.params?.ohms === 'number' && p.kind === 'resistor');
        if (caps.length === 1 && res.length >= 1) {
            const tau = res[0].params.ohms * caps[0].params.farads;
            atMs = parseFloat(n) * tau * 1000;
            labels.push(`t = ${n} tau (${(tau * 1000).toFixed(1)} ms)`);
        }
    }
    return { controls, atMs, labels };
}

/** A table row's condition cells — every cell that is not the claim's own. */
function tableContext (claim) {
    const t = claim.table;
    if (!t || t.isHeader) return '';
    const bits = [];
    for (let c = 0; c < t.row.length && c < t.header.length; c++) {
        if (c === claim.column) continue;
        const head = String(t.header[c]).trim();
        const cell = String(t.row[c]).replace(/\*/g, '').trim();
        if (!cell) continue;
        // A bare cell under a unit-bearing header states its unit in the header.
        const unitInHead = head.match(/[(,]\s*(ms|s|µs|us|V|kΩ|Ω|mA|%)\s*\)?$/i);
        bits.push(unitInHead && /^-?[\d.]+$/.test(cell) ? `${head} = ${cell} ${unitInHead[1]}` : `${head} = ${cell}`);
    }
    return bits.join(' | ');
}

/**
 * A table whose CONDITION lives in the column headers rather than the rows —
 * "| node | gate low | gate high |". Every cell in such a row is a different
 * operating point, and this gate reads conditions from rows.
 */
function conditionIsInHeader (claim) {
    const t = claim.table;
    if (!t || t.isHeader) return false;
    const heads = t.header.slice(1).join(' | ');
    return /\b(low|high|on|off|open|closed|before|after|with|without)\b/i.test(heads) && t.header.length >= 3;
}

/** A row that puts two switches in DIFFERENT states cannot be driven together. */
function twoSwitchRow (claim) {
    const t = claim.table;
    if (!t || t.isHeader) return false;
    const states = t.row.filter(c => /^(closed|open|on|off|pressed|released)$/i.test(c.trim()));
    return states.length >= 2 && new Set(states.map(x => x.toLowerCase())).size >= 2;
}

/** Whether this claim IS the condition its row is asking about. */
export function isConditionLabel (claim) {
    const t = claim.table;
    if (!t || t.isHeader) return false;
    if ((claim.column ?? -1) !== 0) return false;
    // A leading cell is the question the row answers whenever the header names
    // a condition — and a bare "| mode V, source pot 60% |" is one even when
    // the header does not say so, because no measurement lives in column 0 of
    // a table whose other columns are the readings.
    const cell = String(t.row[0] || '');
    return /^(t|time|position|vin|v_?in|input|supply|light|r_?ldr|mode|state|level|sound|condition|scenario|case|reading|node|resistor)\b/i
        .test(String(t.header[0] || '').trim())
        || /[a-z]{3}/i.test(cell)
        // "| 1000–1199 mV |", "| ≤ 999 mV |" — a band, not a measurement.
        || /[–—]|\.\.|≤|≥|<|>/.test(cell);
}

/** The states a bench can be PUT in, when the claim names none. */
const STATES = new Map();
export function enumerateStates (dir) {
    if (STATES.has(dir)) return STATES.get(dir);
    const first = solveBench(dir);
    const states = [{ label: 'as authored' }];
    if (!first.error) {
        const kinds = new Set((first.parts || []).map(p => p.kind));
        if (kinds.has('button') || kinds.has('switch') || kinds.has('slide_switch')) {
            states.push({ controls: { button: 1 }, label: 'button pressed' });
            states.push({ controls: { button: 0 }, label: 'button released' });
        }
        if (kinds.has('potentiometer'))
            for (const p of [0, 0.25, 0.5, 0.75, 1]) states.push({ controls: { potentiometer: p }, label: `pot at ${p}` });
        for (const p of (first.parts || [])) {
            if (p.kind !== 'ldr' && p.kind !== 'ntc') continue;
            for (const k of [0, 0.5, 1]) states.push({ controls: { [p.id]: k }, label: `${p.id} at ${k}` });
        }
        if ((first.parts || []).some(p => /^(mcu|arduino_|pi_pico|attiny|atmega|stc\d|w65c|m?6502|z80|esp)/i.test(p.kind || '')))
            for (const drive of ['low', 'high', 'input', 'quasi-high'])
                states.push({ controls: { __pins: drive }, label: `every MCU pin ${drive}` });
        // A relay's contacts move after switchTimeMs; before that the bench is
        // in the state it was in, and a claim about the switched circuit is
        // about a LATER instant as much as about a closed switch.
        for (const p of (first.parts || [])) {
            if (p.kind !== 'relay') continue;
            const settle = (p.params?.switchTimeMs ?? 5) * 2;
            states.push({ controls: { button: 1 }, atMs: settle, label: `closed, ${settle} ms after` });
        }
    }
    STATES.set(dir, states);
    return states;
}

/**
 * Route one claim.
 * @returns {{point}|{points}|{decline: string}}
 */
export function route (claim) {
    // A condition LABEL is not a claim about behaviour. The "100 ms" in the
    // first cell of an RC table is the question; the volts beside it are the
    // answer. Counting the question would inflate numerator and denominator
    // with nothing.
    if (isConditionLabel(claim))
        return { decline: 'condition label — the leading cell of a table row states the operating point the rest of the row answers for' };

    // What the bench IS decides the reason before what the prose says: a claim
    // on an MCU bench is unverifiable here whether or not its sentence also
    // happens to be hypothetical, and reporting the weaker reason would hide a
    // whole class behind a vaguer one.
    const bench = solveBench(claim.dir);
    if (bench.error) return { decline: bench.error };

    const tctx = tableContext(claim);
    const pre = claim.table && !claim.table.isHeader ? claim.table.preamble : '';
    // A sentence that wraps carries its qualifier on the previous line, so the
    // previous line is part of the claim's context. pc13-direct-diode's "the
    // number quoted at about\n1 mA" is one sentence and one counterfactual.
    const prose = `${claim.section} ${claim.leadIn || ''} ${claim.prevLine || ''} ${claim.line}`;
    if (COUNTERFACTUAL.test(prose) || COUNTERFACTUAL.test(pre))
        return { decline: 'counterfactual or comparative prose — the number is stated about a bench other than this one, or is a rating rather than a measurement' };

    if (conditionIsInHeader(claim))
        return { decline: 'the operating point is named by the COLUMN header rather than the row, and this gate reads conditions from rows' };
    if (twoSwitchRow(claim))
        return { decline: 'the row puts two switches in different states, and this gate drives every switch on a bench together' };
    // One sentence, both states: "the LED runs at 2.97 mA. Open, the ..." says
    // what happens closed AND what happens open, and picking one of them for
    // the whole sentence answers the wrong half of it.
    const sentence = `${claim.prevLine || ''} ${claim.line}`;
    if (/\b(closed|pressed)\b/i.test(sentence) && /\b(open|released)\b/i.test(sentence))
        return { decline: 'the sentence states both switch states at once, so no single operating point is the one it is claiming about' };
    // A cross-reference is a claim about ANOTHER bench. The corpus links
    // examples constantly ("41-pot-as-dimmer is the same circuit at 10 kΩ and
    // measures 0.188 mA"), and holding this bench to that number is a
    // guaranteed false accusation.
    const ref = claim.line.match(/\b((?:pc|arduino|mega|nano|pico|avr|168p)?[a-z]*\d{2,}[a-z0-9-]*)\b/gi) || [];
    if (ref.some(r => r.toLowerCase() !== claim.dir.toLowerCase() && EXAMPLE_DIRS.has(r.toLowerCase())))
        return { decline: 'the line cross-references another example, so the number in it is a claim about that bench rather than this one' };

    const cannot = unsettable(`${prose} ${pre} ${tctx}`);
    if (cannot) return { decline: cannot };

    // The previous line is context for JUDGING a claim, never for setting the
    // operating point: 73-voltmeter's "Pot at 50 %" bullet follows an "All pots
    // at zero" bullet, and letting that leak put the pot at 0 for a claim that
    // says 50 in its own words.
    const read = readConditions(`${tctx} ${claim.section} ${claim.leadIn || ''} ${claim.line}`, bench.parts);
    if (!read.labels.length) return { points: enumerateStates(claim.dir) };
    const base = { controls: read.controls, atMs: read.atMs, label: read.labels.join(', ') };
    // An axis the claim did not name is still an axis. A blink table names the
    // time and leaves the pin drive to the column beside it, or to nothing at
    // all; expanding the unnamed axis checks the claim against the states the
    // bench can be in AT that stated time, rather than against one arbitrary one.
    const axes = [];
    if (read.controls.__pins === undefined &&
        (bench.parts || []).some(p => /^(mcu|arduino_|pi_pico|attiny|atmega|stc\d|w65c|m?6502|z80|esp)/i.test(p.kind || '')))
        axes.push(['__pins', ['low', 'high', 'input', 'quasi-high']]);
    if (read.controls.button === undefined &&
        (bench.parts || []).some(p => ['button', 'switch', 'slide_switch'].includes(p.kind)))
        axes.push(['button', [1, 0]]);
    if (!axes.length) return { point: base };
    let points = [base];
    for (const [key, values] of axes)
        points = points.flatMap(pt => values.map(v => ({
            ...pt, controls: { ...pt.controls, [key]: v }, label: `${pt.label}, ${key.replace('__', '')} ${v}`,
        })));
    return { points };
}

/**
 * The part a claim is about, when it says so — the leading cell of a results
 * table ("| R1 | 3.9 | 11.82 |") or a bullet label ("**Voltage across R1:**").
 * Pinning the measurand to the named part turns "some number in this bench
 * equals this" into "THIS element's number equals this", which is the
 * difference between a coincidence and a check.
 */
export function partHint (claim, parts) {
    const t = claim.table;
    const namesParts = t && !t.isHeader &&
        /^(component|part|node|element|signal|net|measurement|point|terminal|pin|led)\b/i.test(String(t.header[0] || '').trim());
    const cells = namesParts ? [String(t.row[0] || '')] : [];
    // The claim's OWN column header names what the column measures. Without
    // this a results table is checked against every measurand on the bench, and
    // a wiper voltage mutated from 2.2380 to 2.9000 still passes because some
    // other pair of nodes happens to differ by 2.99 V. The header says "wiper".
    if (t && !t.isHeader && claim.column !== undefined && t.header[claim.column])
        cells.push(String(t.header[claim.column]));
    // A bullet label names a part only when it says so: "Voltage across R1" is
    // about r1, and "Input reaches ~2.5 V (VCC/2)" is not about the vcc part —
    // it mentions the rail to say what half of it is.
    const label = (claim.line.match(/^-\s*\*\*([^*]+)\*\*/) || [])[1] || '';
    const hay = `${cells.join(' ')} ${/\bacross\b|\bthrough\b|\bin\b/i.test(label) ? label : ''}`.toLowerCase();
    if (!hay.trim()) return null;
    for (const p of parts || []) {
        if (new RegExp(`\\b${p.id.toLowerCase().replace(/[^a-z0-9]/g, '.')}\\b`).test(hay)) return p.id;
    }
    for (const p of parts || []) {
        const word = String(p.kind).split('_')[0];
        if (word.length < 3) continue;
        const alone = (parts || []).filter(q => q.kind === p.kind).length === 1;
        if (!alone) continue;
        if (new RegExp(`\\b${word}\\b`).test(hay)) return p.id;
    }
    return null;
}

/**
 * The terminal a claim names, when its column header or bullet label is one —
 * "wiper", "LED anode", "base", "collector". Pins the comparison to the NET
 * that terminal sits on rather than to the bench at large.
 */
export function terminalHint (claim, parts) {
    const t = claim.table;
    const bits = [];
    if (t && !t.isHeader && claim.column !== undefined && t.header[claim.column]) bits.push(String(t.header[claim.column]));
    const label = (claim.line.match(/^-\s*\*\*([^*]+)\*\*/) || [])[1];
    if (label) bits.push(label);
    const hay = bits.join(' ').toLowerCase();
    if (!hay.trim()) return null;
    for (const term of ['wiper', 'anode', 'cathode', 'base', 'collector', 'emitter', 'drain', 'gate', 'source'])
        if (new RegExp(`\\b${term}\\b`).test(hay)) return term;
    return null;
}

/**
 * The timeline a program.bw actually runs — waits, with REPEAT honoured, and
 * the LED state each wait is spent in.
 *
 * A flat scan for `wait` lines reads 13-sos-morse as nine waits totalling
 * 2.6 s. The program is `REPEAT 3` three times over and runs for 6.6 s, of
 * which 3.0 s is lit. Every duty cycle and every cycle period derived from the
 * flat list is therefore wrong about a program that is right, which is the
 * defect this gate exists to avoid committing itself.
 *
 * The subset understood is the one the corpus writes: REPEAT n / FOREVER
 * blocks delimited by indentation, `turn on|off <pin>`, and `wait x
 * seconds|ms`. FOREVER is the outer cycle and contributes one pass — its body
 * IS the period. Anything richer (conditionals, variable waits) leaves the
 * timeline incomplete, and `complete` says so rather than letting a partial
 * timeline speak as a whole one.
 */
const TIMELINE = new Map();
export function timelineOf (dir) {
    if (TIMELINE.has(dir)) return TIMELINE.get(dir);
    const src = programOf(dir);
    if (!src) { TIMELINE.set(dir, { waits: [], on: 0, total: 0, complete: false }); return TIMELINE.get(dir); }

    const lines = src.split('\n').filter(l => l.trim() && !/^\s*#/.test(l));
    const indent = (l) => l.match(/^\s*/)[0].replace(/\t/g, '    ').length;
    let complete = true;
    let lit = false;
    const waits = [];
    const outputs = new Set();
    let on = 0, total = 0;

    const run = (from, to, depth) => {
        let i = from;
        while (i < to) {
            const line = lines[i];
            const text = line.trim();
            if (indent(line) < depth) return i;
            const rep = text.match(/^(?:REPEAT\s+(\d+)|FOREVER)\s*:?\s*$/i);
            if (rep) {
                const times = rep[1] ? parseInt(rep[1], 10) : 1;
                // The block is every following line indented deeper.
                let j = i + 1;
                const inner = j < to ? indent(lines[j]) : depth;
                while (j < to && indent(lines[j]) > indent(line)) j++;
                for (let k = 0; k < times; k++) run(i + 1, j, inner);
                i = j;
                continue;
            }
            const w = text.match(/^wait\s+([\d.]+)\s+(seconds?|ms|milliseconds?)\s*$/i);
            if (w) {
                const secs = /^m/i.test(w[2]) ? parseFloat(w[1]) / 1000 : parseFloat(w[1]);
                waits.push(secs); total += secs;
                if (lit) on += secs;
                i++; continue;
            }
            const sw = text.match(/^turn\s+(on|off)\s+(\S+)/i);
            if (sw) { lit = sw[1].toLowerCase() === 'on'; outputs.add(sw[2]); i++; continue; }
            if (/^turn\s+(on|off)\b/i.test(text)) { lit = /on/i.test(text.slice(5, 9)); i++; continue; }
            if (/^(WHEN|DEVICE|CLOCK|PIN|SET|DEFINE)\b/i.test(text)) { i++; continue; }
            if (/^(IF|ELSE|WHILE|UNTIL|BROADCAST|CALL)\b/i.test(text)) { complete = false; i++; continue; }
            i++;
        }
        return i;
    };
    run(0, lines.length, 0);
    // With more than one output driven, "lit" is the union of several LEDs and
    // is nobody's duty cycle: 14-traffic-light is lit 4 s of 7 s while its red
    // is on for 3. A per-LED timeline is a bigger machine than this gate needs,
    // so it says so instead of answering for the wrong lamp.
    const out = { waits, on, total, complete, outputs: outputs.size };
    TIMELINE.set(dir, out);
    return out;
}

/** The waits an example's program states, flattened through REPEAT. */
export function waitsOf (dir) { return timelineOf(dir).waits; }
