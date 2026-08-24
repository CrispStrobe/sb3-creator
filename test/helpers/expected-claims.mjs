/**
 * The census of numeric claims in EXPECTED.md, and the routing that decides
 * which of them a gate can actually check.
 *
 * WHY A CENSUS AND NOT A LIST OF CHECKS
 * ------------------------------------
 * `test/assert-physics.test.mjs` reads the fenced ```assert blocks, and
 * `expected-quantities-hold` used to read three hand-written shapes out of the
 * prose: a frequency beside a period, a Frequency: beside a two-wait program,
 * and at most ONE current bullet per example. Everything else in the prose was
 * unread. That is not a small remainder — the prose carries 2078 unit-bearing
 * numbers, and the checks above reached 67 of them.
 *
 * The defects already found in that unread body are all one class: a document
 * that agreed with a broken bench, and therefore looked correct until the bench
 * was fixed. 23-voltage-regulator's zener could not clamp. 41-pot-as-dimmer
 * claimed 2.3 mA where the bench delivers 0.188. A documented smiley beat a
 * heart. None of those were exotic; each was a number that was true when typed.
 *
 * So the unit of work here is the CLAIM, not the check. Every unit-bearing
 * number in every EXPECTED.md is enumerated first and given an identity, and
 * then each one is either checked against the engine or explicitly declined
 * with a reason. The fraction checked is a reported number with a denominator,
 * and a claim nobody can check is visible as such rather than absent.
 *
 * WHAT COUNTS AS A CLAIM
 * ----------------------
 * A number immediately followed by a physical unit, in the prose, outside any
 * fenced block. Fenced blocks are excluded because ```assert is assert-physics'
 * territory and ```bw / ```c are program text, not claims about behaviour.
 *
 * WHAT A SECTION MEANS
 * --------------------
 * The heading a claim sits under is load-bearing and not cosmetic. Under
 * `## Circuit` a component value is a statement about THIS bench and can be
 * held against circuit.json. The same "220 Ω" under `## Observable behaviour`
 * is usually a row in a what-if table — "with 220 Ω you would get 13.6 mA" —
 * and holding it against the bench would manufacture a mismatch out of a
 * correct sentence. Section is therefore recorded per claim and the routers use
 * it.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = join(import.meta.dirname, '..', '..');
export const EXAMPLES = join(ROOT, 'examples');

export const exampleDirs = () => readdirSync(EXAMPLES)
    .filter(d => d !== 'AUDIT' && statSync(join(EXAMPLES, d)).isDirectory()).sort();

/** SI multiplier per unit token, and the quantity class it belongs to. */
const UNIT = {
    // The corpus spells the word form four ways — "220 Ohm", "10 kOhm",
    // "10 kohm", "220 ohm" — and reading only the lower-case ones dropped 95
    // component-value claims out of the census, including every value in
    // 21-resistor-led's circuit description.
    'Ω': [1, 'ohm'], 'ohm': [1, 'ohm'], 'ohms': [1, 'ohm'],
    'Ohm': [1, 'ohm'], 'Ohms': [1, 'ohm'], 'OHM': [1, 'ohm'],
    'kΩ': [1e3, 'ohm'], 'kohm': [1e3, 'ohm'], 'kohms': [1e3, 'ohm'],
    'kOhm': [1e3, 'ohm'], 'kOhms': [1e3, 'ohm'], 'KOhm': [1e3, 'ohm'], 'Kohm': [1e3, 'ohm'], 'Kohms': [1e3, 'ohm'],
    'MΩ': [1e6, 'ohm'], 'Mohm': [1e6, 'ohm'], 'Mohms': [1e6, 'ohm'], 'MOhm': [1e6, 'ohm'], 'MOhms': [1e6, 'ohm'],
    'F': [1, 'cap'], 'µF': [1e-6, 'cap'], 'uF': [1e-6, 'cap'],
    'nF': [1e-9, 'cap'], 'pF': [1e-12, 'cap'],
    'V': [1, 'volt'], 'mV': [1e-3, 'volt'], 'kV': [1e3, 'volt'],
    'A': [1, 'curr'], 'mA': [1e-3, 'curr'], 'µA': [1e-6, 'curr'], 'uA': [1e-6, 'curr'], 'nA': [1e-9, 'curr'],
    'Hz': [1, 'freq'], 'kHz': [1e3, 'freq'], 'MHz': [1e6, 'freq'],
    's': [1, 'time'], 'sec': [1, 'time'], 'secs': [1, 'time'],
    'second': [1, 'time'], 'seconds': [1, 'time'],
    'ms': [1e-3, 'time'], 'µs': [1e-6, 'time'], 'us': [1e-6, 'time'], 'ns': [1e-9, 'time'],
    'min': [60, 'time'],
    'W': [1, 'power'], 'mW': [1e-3, 'power'], 'µW': [1e-6, 'power'],
    '%': [1, 'pct'], 'percent': [1, 'pct'],
    '°C': [1, 'temp'], '°F': [1, 'temp'],
    'H': [1, 'ind'], 'mH': [1e-3, 'ind'], 'µH': [1e-6, 'ind'],
};

/**
 * The unit alternation, longest-first so `kΩ` wins over `Ω` and `ms` over `s`.
 * The trailing guard rejects `5 Vcc` and `2 sample`, and the leading one
 * rejects the `12` of `R12`.
 */
const UNIT_ALT = Object.keys(UNIT)
    .sort((a, b) => b.length - a.length)
    .map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// The corpus writes a negative with U+2212 MINUS SIGN, not a hyphen —
// pc34-polarity-protector's whole table is "| −9 V | −4.4955 V |". Reading only
// the ASCII hyphen turns every one of those into its positive twin, which is a
// claim silently checked against the wrong number.
const NUM = new RegExp(String.raw`(?<![\w.])([-−–]?\d+(?:\.\d+)?)\s*(${UNIT_ALT})(?![\w])`, 'g');
/**
 * A leading dash is a SIGN only where a sign can stand. Between two quantities
 * it is a range: pc74-ldr-555-blinker's "R2 = LDR (1 kΩ–100 kΩ)" is a span, and
 * reading it as −100 kΩ invents a negative resistance and then reports the
 * bench for not having one.
 */
const signed = (t, before) => {
    const raw = String(t);
    const isSign = /^[-−–]/.test(raw) && !/[\wΩ%)\]]/.test(before || '');
    return parseFloat((isSign ? raw : raw.replace(/^[-−–]/, '')).replace(/[−–]/, '-'));
};

/** Blank out fenced blocks so ```assert and ```bw contribute no claims. */
const withoutFences = (md) => {
    const out = [];
    let fence = null;
    for (const line of md.split('\n')) {
        const m = line.match(/^\s*(```+|~~~+)/);
        if (m) {
            if (fence === null) fence = m[1];
            else if (m[1].startsWith(fence)) fence = null;
            out.push('');
            continue;
        }
        out.push(fence === null ? line : '');
    }
    return out;
};

/**
 * Every unit-bearing number in one example's EXPECTED.md.
 *
 * `id` is stable across runs (`dir#line:col`) so a claim can be named in a
 * disposition table and in a commit message.
 */
/** The unit a column header carries, e.g. "I_LED (mA)" or "V_wiper, V". */
function headerUnit (header) {
    const m = String(header).match(/[(,]\s*([^)（,]*?)\s*\)?$/);
    const token = (m ? m[1] : '').trim();
    return Object.prototype.hasOwnProperty.call(UNIT, token) ? token : null;
}

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
const isRule = (line) => /^\s*\|[\s|:-]+\|\s*$/.test(line);

export function claimsOf (dir) {
    const path = join(EXAMPLES, dir, 'EXPECTED.md');
    if (!existsSync(path)) return [];
    const lines = withoutFences(readFileSync(path, 'utf8'));

    // Table geometry, resolved first: a claim in a table row is a claim about
    // the condition in that row's leading cells, and the header names what that
    // condition IS. Without the header a "| 6 V |" is unreadable.
    const table = new Array(lines.length).fill(null);
    for (let i = 0; i < lines.length; i++) {
        if (!isRule(lines[i]) || i === 0 || !lines[i - 1].includes('|')) continue;
        const header = cells(lines[i - 1]);
        // Prose immediately above the table often disclaims it ("UNLOADED
        // approximations"), and that disclaimer governs every row.
        const preamble = lines.slice(Math.max(0, i - 6), i - 1).join(' ');
        for (let j = i + 1; j < lines.length && lines[j].trim().startsWith('|'); j++)
            table[j] = { header, preamble, row: cells(lines[j]) };
        table[i - 1] = { header, preamble, row: header, isHeader: true };
    }

    const claims = [];
    let section = '';
    let leadIn = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const h = line.match(/^#{2,6}\s+(.*?)\s*$/);
        if (h) { section = h[1]; leadIn = ''; continue; }
        // The sentence that introduces a bullet list governs every bullet under
        // it. "If VCC changes from 9 V to 12 V:" is the operating point for the
        // three bullets that follow, and reading those bullets without it is
        // how a correct paragraph gets marked wrong three times.
        if (/:\s*$/.test(line) && !line.trim().startsWith('|')) leadIn = line.trim();
        else if (!line.trim()) leadIn = '';
        // A bare number in a column whose HEADER carries the unit — "| 0.5 |
        // 2.5 V | 2.3 |" under "… | I_LED (mA) |" — is a claim stated exactly
        // once per column instead of once per cell. Reading only the cells
        // would drop a whole table of currents on the floor while reporting
        // full coverage of the ones that happen to repeat their unit.
        const t = table[i];
        if (t && !t.isHeader) {
            for (let c = 0; c < t.row.length && c < t.header.length; c++) {
                const unit = headerUnit(t.header[c]);
                if (!unit) continue;
                const cell = t.row[c];
                if (NUM.test(cell)) { NUM.lastIndex = 0; continue; }   // the cell states its own unit
                NUM.lastIndex = 0;
                const bare = cell.match(/^\*{0,2}~?([-−–]?\d+(?:\.\d+)?)\s*(?:%)?\*{0,2}$/);
                if (!bare) continue;
                const [mult, cls] = UNIT[unit];
                claims.push({
                    dir, section, lineNo: i + 1, line: line.trim(),
                    text: `${bare[1]} ${unit} (column "${t.header[c]}")`,
                    value: signed(bare[1], ''), unit, si: signed(bare[1], '') * mult, cls,
                    id: `${dir}#${i + 1}:col${c}`,
                    approx: /~/.test(cell), table: t, leadIn, prevLine: (lines[i - 1] || '').trim(),
                    fromHeader: true, column: c,
                });
            }
        }
        for (const m of line.matchAll(NUM)) {
            const [mult, cls] = UNIT[m[2]];
            claims.push({
                dir, section, lineNo: i + 1, line: line.trim(),
                text: m[0], value: signed(m[1], line[m.index - 1]), unit: m[2],
                si: signed(m[1], line[m.index - 1]) * mult, cls,
                id: `${dir}#${i + 1}:${m.index}`,
                approx: /[~≈約]|about|roughly|approx/i.test(line.slice(Math.max(0, m.index - 12), m.index + 2)),
                table: table[i], leadIn, prevLine: (lines[i - 1] || '').trim(),
                // Which table cell this number is in, counted rather than
                // guessed: a value that also appears in the condition cell
                // must not be mistaken for the condition.
                column: table[i] && !table[i].isHeader
                    ? Math.max(0, (line.slice(0, m.index).match(/\|/g) || []).length - 1) : undefined,
            });
        }
    }
    return claims;
}

export const allClaims = () => exampleDirs().flatMap(claimsOf);

/** The authored bench. Generated `circuit-flat.*.json` variants are not it. */
export function benchOf (dir) {
    const path = join(EXAMPLES, dir, 'circuit.json');
    if (!existsSync(path)) return null;
    try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

export const programOf = (dir) => {
    const path = join(EXAMPLES, dir, 'program.bw');
    return existsSync(path) ? readFileSync(path, 'utf8') : null;
};

/**
 * A disposition ledger. Every claim ends in exactly one of three states, and
 * the totals are what the gate reports.
 */
export class Ledger {
    constructor () { this.checked = []; this.skipped = []; this.mismatched = []; }
    check (claim, note) { this.checked.push({ ...claim, note }); }
    skip (claim, reason) { this.skipped.push({ ...claim, reason }); }
    miss (claim, detail) { this.mismatched.push({ ...claim, detail }); }
    get total () { return this.checked.length + this.skipped.length + this.mismatched.length; }
    /** Checked includes mismatched: a mismatch is a claim that WAS compared. */
    get compared () { return this.checked.length + this.mismatched.length; }
    skipReasons () {
        const by = new Map();
        for (const s of this.skipped) by.set(s.reason, (by.get(s.reason) || 0) + 1);
        return [...by.entries()].sort((a, b) => b[1] - a[1]);
    }
}
