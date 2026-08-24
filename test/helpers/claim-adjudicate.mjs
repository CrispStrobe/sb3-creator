/**
 * The verdict on one claim: checked, mismatched, or declined with a reason.
 *
 * TOLERANCES, AND WHY THEY ARE NOT ONE NUMBER
 * -------------------------------------------
 * A component value is a declaration and must match exactly; 2 % is there for
 * "1 k" written as 1000 vs 1024, not for slack. A solved quantity is a
 * different thing: the documents derive from an ideal forward drop while the
 * engine solves a junction, so a few percent between them is two models
 * disagreeing rather than a document being wrong. 10 % is the band the previous
 * gate used for exactly that reason and it is kept, so a tightening is a
 * deliberate later act rather than a silent side effect of this rewrite.
 *
 * A claim of ZERO needs an absolute floor, not a relative one: "0 mA (diode
 * blocks)" against a solved 3.03 nA is a 100 % relative error and a correct
 * document. Below a microamp the two statements mean the same thing.
 */
import { solveBench, declaredPool } from './bench-measure.mjs';
import { route, waitsOf, timelineOf, partHint, terminalHint, isConditionLabel } from './claim-router.mjs';

const FLOOR = { curr: 1e-6, volt: 1e-3, power: 1e-6, time: 1e-9, freq: 1e-3, ohm: 1e-3, cap: 1e-15, ind: 1e-12, pct: 0.05 };

const agrees = (claim, x, tol) => {
    const floor = FLOOR[claim.cls] ?? 0;
    if (Math.abs(claim.si) <= floor && Math.abs(x) <= floor) return true;
    return Math.abs(x - claim.si) <= tol * Math.max(Math.abs(x), Math.abs(claim.si));
};

const nearest = (claim, xs, n = 4) => xs
    .slice().sort((a, b) => Math.abs(a - claim.si) - Math.abs(b - claim.si))
    .slice(0, n).map(v => Number(v.toPrecision(4)));

/**
 * A claim that shows its own arithmetic.
 *
 * "**LED current:** (5.0 - 2.0) / 470 = 6.4 mA" carries its derivation in the
 * sentence, and the derivation is checkable exactly, with no engine and no
 * tolerance argument: either 3.0/470 is 6.4 mA or the document has drifted from
 * its own reasoning. This is where the ideal-forward-drop claims belong. The
 * engine solves a junction and the documents divide by an ideal Vf, so at LED
 * currents the two models differ by more than a measurement tolerance can
 * absorb — 13.2 mA against the engine's 11.4 on the same bench. Comparing those
 * would report a MODEL DIFFERENCE as a document defect. The arithmetic is the
 * claim the document is actually making, so the arithmetic is what is checked,
 * and the model difference is stated rather than laundered into a verdict.
 */
function arithmetic (claim) {
    // The expression immediately before this claim on its line: numbers,
    // + - x / ( ), and nothing else. Anything richer is not evaluated.
    // Markdown emphasis sits between the "=" and the answer often enough to
    // matter: "τ = 1000 x 0.0001 = **100 ms**" is a derivation with two stars
    // in the way of reading it.
    // "6 V x 100 / 106.667 = 5.625 V" is one expression with a unit inside it.
    // Bare units (V, A, W, Ω, s) carry no scale and can be dropped; a PREFIXED
    // one (kΩ, mA, µF) does, so the expression keeps it and fails to parse
    // rather than being evaluated at the wrong magnitude.
    const upto = claim.line.slice(0, claim.line.indexOf(claim.text.split(' (')[0]))
        .replace(/(?<![kMmµunp])\b(V|A|W|s)\b|(?<![kMmµunp])Ω/g, ' ')
        // "10 000" is one number written with a thousands space, and reading it
        // as 10 times 000 is how pc16-mini-rc's time constant went unchecked.
        .replace(/(\d)[  ](\d{3})\b/g, '$1$2')
        .replace(/[*_`\s]+$/, '');
    const m = upto.match(/([-−–(]?[\d.]+(?:\s*[-−–+x×*/·]\s*[-−–(]?[\d.]+[)]?)+)\s*[=≈]\s*~?$/);
    if (!m) return null;
    // An operator this evaluator does not speak makes the SLICE it did capture
    // a different sum from the one written. "4.50^2 / 10000" reads as 2/10000
    // and "100 Ω || (470 + 2)" as 470 + 2 — both are confident wrong answers
    // about correct documents, so a foreign operator anywhere in the derivation
    // aborts rather than truncates.
    const before = upto.slice(0, m.index);
    if (/[\^∥]|\|\||√|²|³/.test(before + m[1])) return null;
    const expr = m[1].replace(/[−–]/g, '-').replace(/[x×·]/g, '*');
    if (!/^[-+*/().\d\s]+$/.test(expr)) return null;
    let value;
    try { value = Function(`"use strict";return (${expr})`)(); } catch { return null; }
    if (!Number.isFinite(value)) return null;
    // The documents mix unit systems inside one expression on purpose:
    // "(5.0 - 2.0) / 1000 = 3.0 mA" divides volts by ohms and writes the answer
    // in milliamps, and "3/7 = 42.9 %" writes a ratio as a percentage. Both
    // readings are the same statement, so both are accepted. What this cannot
    // catch is a pure factor-of-the-unit slip; what it does catch is the
    // mantissa drifting from the arithmetic beside it, which is the defect that
    // actually occurs.
    const readings = [claim.value, claim.si];
    if (claim.cls === 'pct') readings.push(claim.value / 100);
    // Unit prefixes are powers of a thousand, so a derivation written in volts
    // over ohms and answered in milliamps differs from its answer by exactly
    // 10^3. Accepting those keeps the MANTISSA under check while letting the
    // documents go on writing the conversion in their heads.
    for (const r of [...readings]) for (const k of [3, -3, 6, -6]) readings.push(r * 10 ** k);
    return readings.some(r => agrees({ ...claim, si: r }, value, 0.02))
        ? { ok: true, how: `its own arithmetic (${expr} = ${Number(value.toPrecision(4))})` }
        : { detail: `the line's own arithmetic gives ${Number(value.toPrecision(4))}, not ${claim.value}`, how: 'self-consistency' };
}

/** ohm / cap / ind / a component's declared volt: held against circuit.json. */
function component (claim) {
    const pool = declaredPool(claim.dir);
    if (!pool) return { skip: 'no authored circuit.json to hold the declared value against' };
    const set = claim.cls === 'volt' ? new Set([...pool.vf, ...pool.supply]) : pool[claim.cls];
    if (!set.size) return { skip: `the bench declares no ${claim.cls === 'volt' ? 'supply or forward drop' : claim.cls} — the document names a component the bench does not have` };
    const xs = [...set];
    const tol = claim.approx ? 0.25 : 0.02;
    if (xs.some(x => agrees(claim, x, tol))) return { ok: true, how: 'declared in circuit.json' };
    return { detail: `the bench declares {${xs.join(', ')}}`, how: 'declared in circuit.json' };
}

/** volt / curr / power: held against a solve at the operating point the claim names. */
function solved (claim) {
    const r = route(claim);
    if (r.decline) return { skip: r.decline };
    const points = r.point ? [r.point] : r.points;
    const tol = claim.approx ? 0.20 : 0.10;
    const seen = [];
    let anyError = null;
    let pinned = null, terminal = null, pinnedNets = null;
    for (const p of points) {
        const s = solveBench(claim.dir, p);
        if (s.error) { anyError = s.error; continue; }
        pinned = pinned ?? partHint(claim, s.parts);
        terminal = terminal ?? terminalHint(claim, s.parts);
        // A named terminal pins the comparison to the net that terminal is on.
        if (terminal) {
            pinnedNets = new Set();
            for (const net of (s.nets || []))
                for (const t of (net.terminals || []))
                    if (String(t.terminal).toLowerCase() === terminal &&
                        (!pinned || t.part === pinned)) pinnedNets.add(net.id || net.name);
            if (!pinnedNets.size) pinnedNets = null;
        }
        // When the claim names its terminal or its part, ONLY that may answer,
        // and nothing else may. Leaving the other measurands in the pool
        // alongside a pin is not a weaker check, it is no check: a wiper
        // voltage moved from 2.2380 to 2.9000 still passed because some other
        // pair of nodes on the same bench differs by 2.993 V.
        const pool = s.measurands.filter(m => {
            if (m.unit !== claim.cls) return false;
            if (pinnedNets) return m.kind === 'node' && pinnedNets.has(m.label);
            if (!pinned) return true;
            // A claim about R1 is about R1 ALONE. A measurand that belongs to
            // R1 *and something else* — a series pair's summed drop, a net's
            // KCL throughput — mentions R1 without being about it, and letting
            // those answer is how "| R1 | 3.9 V |" mutated to 7.4 still passed
            // (r1's drop plus r2's is 6.97) and how an LED current of 12.965 mA
            // mutated to 17.965 still passed (the whole supply carries 17.95).
            if (!(m.on || []).includes(pinned)) return false;
            return m.kind === 'node' || (m.on || []).length === 1;
        });
        if (!pool.length) continue;
        seen.push(...pool.map(m => m.si));
        const hit = pool.find(m => agrees(claim, m.si, tol));
        if (hit) return { ok: true, how: `solved${p.label ? ` (${p.label})` : ''}${pinned ? ` on ${pinned}` : ''}${terminal ? `.${terminal}` : ''}`, matched: hit.label };
    }
    if (!seen.length) return { skip: anyError || `the bench exposes no ${claim.cls} the engine can read` };
    // A declared parameter no model reads is not a claim anyone can check.
    // `rInternal` appears in eight batteries across the corpus and NOWHERE in
    // bw-board: every battery sits at its open-circuit EMF under any load, so
    // an internal drop is unverifiable here — a gap in the engine, not a defect
    // in the document. See the canary in this file's suite.
    if (/internal resistance|r_?int(ernal)?\b|terminal voltage|klemmenspannung/i.test(`${claim.section} ${claim.line}`)) {
        const s0 = solveBench(claim.dir, points[0]);
        if ((s0.parts || []).some(p => typeof p.params?.rInternal === 'number'))
            return { skip: 'the bench declares rInternal and no bw-board model stamps it — every source solves as ideal, so an internal drop or a sagging terminal voltage has no readback at all' };
    }
    if (claim.cls === 'curr' && /\bbase\b|\bcollector\b|\bemitter\b|\bdrain\b|\bgate\b|I_?[bcegds]\b/i.test(claim.line)) {
        const s0 = solveBench(claim.dir, points[0]);
        if ((s0.parts || []).some(p => (s0.extracted || new Set()).has(p.kind)))
            return { skip: "a transistor terminal current: solveMNA EXTRACTS these from the terminal voltages through the device's knee model rather than solving for them, and the result is not KCL-consistent (430 mA into a base on a bench drawing 2.8 mA), so the engine has no trustworthy readback for it" };
    }
    if (claim.cls === 'curr') {
        const bench = solveBench(claim.dir);
        const named = [...(bench.silent || [])].filter(k => new RegExp(`\\b${k.replace(/_/g, '[ _]?')}s?\\b`, 'i').test(claim.line) || new RegExp(k.split('_')[0], 'i').test(claim.line));
        if (named.length) return { skip: `the current is through a ${named[0]}, whose device model does not implement branchCurrents — the engine has no readback for it, so this claim is unverifiable rather than wrong` };
    }
    // A MODEL DIFFERENCE is not a verdict, and it is not a blanket excuse
    // either. The documents divide by a DECLARED forward drop and a NOMINAL
    // rail; the engine solves a junction behind a pin's output impedance. Where
    // the document's number IS the ideal-model answer, saying it disagrees with
    // the engine would be a false accusation — but only then. A number that is
    // neither the ideal answer nor the solved one is simply wrong, and an
    // earlier cut of this rule declined those too, which cost it a mutation:
    // pc07's 12.965 mA moved to 17.965 and the gate stayed green.
    const s0 = solveBench(claim.dir, points[0]);
    const pool0 = declaredPool(claim.dir);
    const rail = pool0 && pool0.supply.size ? Math.max(...pool0.supply) : null;
    if (rail && (claim.cls === 'curr' || claim.cls === 'volt')) {
        const ideal = [];
        const drops = [];
        for (const p of (s0.parts || [])) {
            if (p.kind !== 'led' && p.kind !== 'diode') continue;
            const vf = p.params?.vf ?? (p.kind === 'diode' ? 0.7 : 2.0);
            const solvedDrop = (s0.measurands || []).find(m => m.kind === 'drop' && m.label === `across ${p.id}`);
            if (solvedDrop && solvedDrop.si > 0.1 && Math.abs(solvedDrop.si - vf) / vf > 0.02) drops.push({ p, vf, solved: solvedDrop.si });
            for (const r of (s0.parts || [])) {
                if (r.kind !== 'resistor' || typeof r.params?.ohms !== 'number') continue;
                ideal.push((rail - vf) / r.params.ohms);
            }
        }
        if (claim.cls === 'curr' && drops.length && ideal.some(x => agrees(claim, x, 0.03))) {
            const d = drops[0];
            return { skip: `the document divides by ${d.p.id}'s DECLARED forward drop of ${d.vf} V — the ideal-model answer — while the engine's junction solves to ${d.solved.toFixed(3)} V here; a model difference, not a document defect, and the line's own arithmetic is what this gate holds it to` };
        }
        // The same divergence from the other end: a pushpull pin sits behind
        // R_STRONG rather than on the rail. pico01-blink's GP25 reads 3.1824 V
        // against a 3.3 V rail. Declined only for a claim that IS the nominal
        // rail — anything else is a number about this bench.
        const drivenHigh = /high/i.test(String(points[0]?.label || '')) || points.some(pt => pt.controls?.__pins === 'high');
        if (claim.cls === 'volt' && drivenHigh && agrees(claim, rail, 0.01)) {
            const top = Math.max(...(s0.voltage ? [...s0.voltage.values()] : [0]));
            if (top > 0 && Math.abs(top - rail) / rail > 0.02)
                return { skip: `the document states the nominal ${rail} V rail while the engine's driven pin sits at ${top.toFixed(4)} V behind its output impedance — a ${((rail - top) / rail * 100).toFixed(0)} % model difference, not a document defect` };
        }
    }
    const where = r.point ? `at ${r.point.label}` : `in any of ${points.length} reachable states`;
    return { detail: `no ${claim.cls} measurand${pinned ? ` on ${pinned}` : ''} ${where} agrees; nearest ${nearest(claim, seen).join(', ')}`, how: 'solved' };
}

/** A frequency stated beside a period, or beside the program that produces it. */
function timing (claim) {
    const waits = waitsOf(claim.dir);
    if (claim.cls === 'freq') {
        // Reciprocity with a period on the same line is a claim about the
        // document itself and needs no bench at all.
        const t = claim.line.match(/(?:period|periode)\s*[=:]?\s*~?([\d.]+)\s*(ms|µs|us|s)\b/i);
        if (t) {
            const seconds = t[2] === 'ms' ? parseFloat(t[1]) / 1000 : /^[µu]s$/.test(t[2]) ? parseFloat(t[1]) / 1e6 : parseFloat(t[1]);
            return agrees(claim, 1 / seconds, 0.02)
                ? { ok: true, how: 'reciprocal of the period stated beside it' }
                : { detail: `the same line states a ${(seconds * 1000).toFixed(0)} ms period, which is ${(1 / seconds).toPrecision(4)} Hz`, how: 'reciprocity' };
        }
        if (waits.length >= 2 && /\*\*Frequency/i.test(claim.line)) {
            // "1.25 Hz full cycle" is the whole pattern, not the first two waits.
            const whole = /full cycle|whole cycle|complete cycle|per cycle/i.test(claim.line);
            const period = whole ? timelineOf(claim.dir).total : waits.slice(0, 2).reduce((a, b) => a + b, 0);
            return agrees(claim, 1 / period, 0.02)
                ? { ok: true, how: 'the period the program waits out' }
                : { detail: `the program's ${whole ? 'whole cycle' : 'first two waits'} run ${period} s = ${(1 / period).toPrecision(4)} Hz`, how: 'programme timing' };
        }
        if (/tone|note|plays|buzzer|piezo|hz\s*\)|\b[A-G]#?\d\b/i.test(claim.line))
            return { skip: 'a tone the firmware commands — this gate does not run firmware, and the bench has no oscillator whose frequency it could read instead' };
        return { skip: 'a frequency with no period stated beside it and no two-wait program to derive one from' };
    }
    // A time constant is the bench's own R x C, and every RC example in the
    // corpus states one. Deriving it needs no program at all.
    // The claim must BE the time constant, not merely share a line with one:
    // "τ = 1 kΩ x 1000 µF = 1 s, which the 0.1 s / 1.0 s rows follow" states
    // one τ and then two row references.
    const head = claim.line.slice(0, claim.line.indexOf(claim.text));
    const isTau = /(?:τ|tau|time constant)/i.test(head) && /[=≈]\s*[*_~ ]*$/.test(head);
    if (isTau) {
        const bench = solveBench(claim.dir);
        const caps = (bench.parts || []).filter(p => typeof p.params?.farads === 'number');
        const res = (bench.parts || []).filter(p => p.kind === 'resistor' && typeof p.params?.ohms === 'number');
        if (caps.length === 1 && res.length >= 1) {
            const taus = res.map(r => r.params.ohms * caps[0].params.farads);
            const multiples = taus.flatMap(t => [1, 2, 3, 5, 7].map(n => n * t));
            if (multiples.some(t => agrees(claim, t, 0.05)))
                return { ok: true, how: `the bench's own R x C (${taus.map(t => t + ' s').join(', ')})` };
            return { detail: `the bench's R x C is ${taus.map(t => t.toPrecision(4) + ' s').join(' or ')}`, how: 'time constant' };
        }
        return { skip: 'a time constant on a bench with no single capacitor to take R x C from' };
    }
    // "Cycle period: 6.6 seconds per SOS sequence" is the timeline's length.
    // The claim must BE the period: "Full cycle takes ~2.5 s (5 LEDs x 500 ms)"
    // states one period and then the arithmetic that makes it.
    const firstTime = claim.line.search(/[\d.]+\s*(?:ms|µs|us|s|seconds?|min)\b/) ===
        claim.line.indexOf(claim.text.split(' (')[0]);
    if (firstTime && /cycle period|per (?:cycle|sequence|pattern)|full cycle|whole cycle/i.test(claim.line)) {
        const tl = timelineOf(claim.dir);
        if (tl.total && tl.complete)
            return agrees(claim, tl.total, 0.02)
                ? { ok: true, how: `the program's whole timeline (${tl.total} s)` }
                : { detail: `the program's cycle runs ${Number(tl.total.toFixed(4))} s`, how: 'programme timing' };
    }
    // time: a duration the program actually waits, or a partial sum of them.
    if (!waits.length) return { skip: 'the example has no program.bw waits to hold a duration against' };
    const sums = new Set(waits);
    let run = 0;
    for (const w of waits) { run += w; sums.add(run); }
    sums.add(waits.reduce((a, b) => a + b, 0));
    const xs = [...sums];
    if (xs.some(x => agrees(claim, x, 0.02))) return { ok: true, how: 'a duration the program waits' };
    return { skip: 'a duration the program does not wait — it names an observation instant or a time constant, which this checker does not derive' };
}

/** An RC table's "% of final" beside the volts in the same row. */
function percent (claim) {
    // A duty cycle is the program's own arithmetic: one wait over the period.
    if (/duty/i.test(`${claim.section} ${claim.line}`)) {
        if (/servo|pulse|pwm/i.test(`${claim.section} ${claim.line}`))
            return { skip: 'a PWM or servo pulse duty — a firmware-generated waveform, not a shape this gate reads from the program\'s waits' };
        const tl = timelineOf(claim.dir);
        if (!tl.total) return { skip: 'a duty cycle on an example whose program states no waits' };
        if (!tl.complete) return { skip: 'a duty cycle on a program with branching this gate does not walk, so its lit time is not known here' };
        if (tl.outputs > 1) return { skip: `a duty cycle on a program driving ${tl.outputs} outputs — the lit time this gate tracks is their union, not the one lamp the claim is about` };
        const duty = tl.on / tl.total * 100;
        return agrees(claim, duty, 0.02)
            ? { ok: true, how: `the program's own timeline (${Number(tl.on.toFixed(4))} s lit of ${Number(tl.total.toFixed(4))} s)` }
            : { detail: `the program is lit ${Number(tl.on.toFixed(4))} s of a ${Number(tl.total.toFixed(4))} s cycle — ${duty.toFixed(1)} %`, how: 'programme duty' };
    }
    const t = claim.table;
    if (!t || t.isHeader) return { skip: 'a percentage outside a table — a duty cycle or a proportion this gate does not derive' };
    if (claim.column === 0 || /[a-z]{3}/i.test(String(t.row[0] || '')) === false && claim.column === undefined && t.row.indexOf(claim.text) === 0)
        return { skip: 'condition label — the leading cell of a table row states the operating point the rest of the row answers for' };
    // "36.9 % of 2.9655 V left" is a fraction of a STEP, not of the rail.
    if (/\bleft\b|\bremaining\b|\bof\s+[\d.]+\s*V\b/i.test(claim.line))
        return { skip: 'a percentage of a step or of a remaining distance, not of the rail — the reference it is a percentage OF is itself a solved quantity this gate does not re-derive' };
    const volts = t.row.map(c => c.replace(/\*/g, '').match(/(-?\d+(?:\.\d+)?)\s*V\b/)).find(Boolean);
    if (!volts) return { skip: 'a percentage with no voltage beside it in the row to be a percentage OF' };
    const pool = declaredPool(claim.dir);
    const rail = pool && pool.supply.size ? Math.max(...pool.supply) : null;
    if (!rail) return { skip: 'a percentage of a rail the bench does not declare' };
    const implied = parseFloat(volts[1]) / rail * 100;
    return agrees(claim, implied, 0.02)
        ? { ok: true, how: 'the fraction of the rail the same row states in volts' }
        : { detail: `${volts[1]} V of a ${rail} V rail is ${implied.toFixed(2)} %`, how: 'row self-consistency' };
}

export function adjudicate (claim) {
    // A claim that states its derivation is judged on that derivation first:
    // it is exact, it needs no bench, and it is what the document asserts.
    const own = arithmetic(claim);
    if (own) return own;

    // The leading cell of a results table is the question, whatever its unit.
    // Routing a time cell to the timing checker made a whole RC table report
    // as "no program.bw waits", which named the wrong absence.
    if (isConditionLabel(claim))
        return { skip: 'condition label — the leading cell of a table row states the operating point the rest of the row answers for' };

    if (['ohm', 'cap', 'ind'].includes(claim.cls)) {
        if (claim.section !== 'Circuit')
            return { skip: 'a component value outside ## Circuit — a what-if row, a derived total, or a value named in passing, not a statement about this bench' };
        return component(claim);
    }
    if (claim.cls === 'volt' &&
        (claim.section === 'Circuit'
            ? /\bV\s*f\b|\bVf\s*=|forward|\bVz\b|zener|VCC|supply|rail|source|battery/i.test(claim.line)
            : /\bVf\s*[=≈]|\bVz\s*[=≈]|forward voltage of|[\d.]\s*V\s+forward voltage/i.test(claim.line)))
        return component(claim);
    if (['volt', 'curr', 'power'].includes(claim.cls)) return solved(claim);
    if (['freq', 'time'].includes(claim.cls)) return timing(claim);
    if (claim.cls === 'pct') return percent(claim);
    return { skip: `${claim.cls} claims have no derivation here — nothing in the engine reads a temperature or a magnetic quantity back` };
}
