/**
 * A program's assignments must land where its reads look.
 *
 * THE DEFECT CLASS
 * ----------------
 * The dialect is prose-shaped, so a statement that is ALMOST right parses as
 * something else entirely rather than failing. The write goes one place, the
 * read looks in another, and the program is syntactically perfect, warning-free
 * and inert. `bw check` passing proves syntax, never semantics.
 *
 * Three shapes have shipped, all green:
 *
 *   `set variable X to Y` — assigns a variable NAMED "variable X" while every
 *   read says "X". Five gallery examples shipped with zero warnings, plausible
 *   transpiles and no working arithmetic.
 *
 *   Prefix bit operators. 20-shift-register-binary wrote
 *   `IF bitand val 128 > 0` and `set val to bitand shiftleft val 1 255`; the
 *   dialect's form is infix, so the parser read three VARIABLE NAMES —
 *   "bitand val 128", "bitand" and "val 1 255" — none of them ever written.
 *   The emitted C was `if ((bitand_val_128 > 0))` and `val = (bitand << val_1_255)`,
 *   which compiles, runs, and latches 0 into the 595 for every counter value:
 *   eight LEDs, dark for the whole 64-second count. Executed both ways to
 *   confirm — as shipped 1 of 10 probe values match EXPECTED.md's table (the
 *   one that is 0), fixed 10 of 10, and all 256 bytes land.
 *
 *   A name that is already a block. arduino-07-row-column-scanning wrote
 *   `set x to ((read potX * 7) / 1023)`, which is Scratch's motion_setx: it
 *   moved the sprite, while `print x` read a variable never written. The
 *   example printed two undefined values forever.
 *
 * THE TWO QUESTIONS
 * -----------------
 * Both defects are invisible in the source and obvious in the parse, so the
 * gate asks the compiler rather than the file:
 *
 *   1. Is any variable NAME really an expression the parser failed to read?
 *      A legitimate identifier here is one word; whitespace, an operator word
 *      or a bare numeral inside a name means a construct was swallowed whole.
 *   2. Is any variable READ that nothing WRITES? That is the shared symptom of
 *      all three shapes, whatever swallowed the assignment.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const dirs = readdirSync(EXAMPLES)
    .filter(d => d !== 'AUDIT' && statSync(join(EXAMPLES, d)).isDirectory())
    .filter(d => existsSync(join(EXAMPLES, d, 'program.bw')))
    .sort();

/** Words that, inside a variable name, mean an operator or keyword was eaten. */
const OPERATOR_WORDS =
    /\b(bitand|bitor|bitxor|bitnot|shiftleft|shiftright|variable|not|and|or|mod|round|abs|join|letter|of|read|item|length|to)\b/i;

/**
 * What the compiler made of this program: the variable names it writes, the
 * names it reads, and the device handles that are names rather than variables.
 */
function symbols(dir) {
    const src = readFileSync(join(EXAMPLES, dir, 'program.bw'), 'utf8');
    let project;
    try { project = new SB3Creator().parse(src); }
    catch (e) { return { ok: false, reason: e.message.split('\n')[0] }; }

    const written = new Set(), read = new Set(), declared = new Set();
    for (const target of project.targets || []) {
        for (const [, v] of Object.entries(target.variables || {})) declared.add(v[0]);
        for (const [, b] of Object.entries(target.blocks || {})) {
            if (!b || typeof b !== 'object' || Array.isArray(b)) continue;
            if (b.opcode === 'data_setvariableto' || b.opcode === 'data_changevariableby') {
                const f = b.fields?.VARIABLE; if (f) written.add(f[0]);
            }
            if (b.opcode === 'data_variable') { const f = b.fields?.VARIABLE; if (f) read.add(f[0]); }
            for (const [, input] of Object.entries(b.inputs || {}))
                for (const candidate of [input?.[1], input?.[2]])
                    if (Array.isArray(candidate) && candidate[0] === 12) read.add(candidate[1]);
        }
    }

    // A device HANDLE is the subject of a multi-word device statement —
    // `set myservo angle to pos`, `set mymotor direction forward`. It reaches
    // the block as a name, and nothing ever assigns it, which is correct.
    const handles = new Set();
    for (const raw of src.split('\n')) {
        const m = raw.trim().match(/^set\s+([A-Za-z_]\w*)\s+[A-Za-z_]\w*(\s+to\s+|\s+\w+\s*$)/i);
        if (m) handles.add(m[1]);
    }
    return { ok: true, written, read, declared, handles };
}

/**
 * RATCHET: programs whose reads knowingly find no write. May only SHRINK.
 * Empty — 20-shift-register-binary and arduino-07-row-column-scanning were
 * repaired rather than recorded here.
 */
const KNOWN_DANGLING = new Map([]);

describe('programs read the variables they write', () => {
    const parsed = new Map(dirs.map(d => [d, symbols(d)]));

    test('the instrument parsed a real corpus', () => {
        // Floors: with no programs or no variables, both assertions below are
        // vacuously true, which is the shape of a gate that cannot fail.
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // dirs.length >= 250 -> observed 280.
        assert.ok(dirs.length >= 250, `only ${dirs.length} programs found`);
        const broken = [...parsed].filter(([, s]) => !s.ok).map(([d, s]) => `${d}: ${s.reason}`);
        assert.deepEqual(broken, [], 'every program.bw must parse for its symbols to be readable');
        const withVars = [...parsed.values()].filter(s => s.ok && s.written.size).length;
        // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
        // withVars >= 80 -> observed 98.
        assert.ok(withVars >= 80, `only ${withVars} programs write any variable — the walker is wrong`);
    });

    test('no variable name is an expression the parser swallowed', () => {
        const bad = [];
        for (const [dir, s] of parsed) {
            if (!s.ok) continue;
            for (const name of new Set([...s.declared, ...s.read, ...s.written])) {
                const why = [];
                if (/\s/.test(name)) why.push('contains whitespace');
                if (OPERATOR_WORDS.test(name)) why.push('contains an operator or keyword word');
                if (/(^|\s)\d/.test(name)) why.push('contains a bare numeric literal');
                if (why.length) bad.push(`${dir}: variable "${name}" — ${why.join('; ')}`);
            }
        }
        assert.deepEqual(bad.sort(), [],
            'A variable name that reads like an expression means the parser took a whole '
            + 'construct for an identifier — the write and the read then name different things. '
            + 'Fix the statement; there is no allowance list for this.');
    });

    test('every variable a program reads is one it also writes', () => {
        const dangling = [];
        for (const [dir, s] of parsed) {
            if (!s.ok) continue;
            for (const name of s.read) {
                if (s.written.has(name) || s.handles.has(name)) continue;
                if (KNOWN_DANGLING.get(dir)?.includes(name)) continue;
                dangling.push(`${dir}: reads "${name}", nothing writes it`);
            }
        }
        assert.deepEqual(dangling.sort(), [],
            'A read with no write is the shared symptom of every assignment that landed '
            + 'somewhere other than where the reads look. It always evaluates to 0 and never warns.');
    });

    test('KNOWN_DANGLING carries nothing that no longer reproduces', () => {
        const stale = [];
        for (const [dir, names] of KNOWN_DANGLING) {
            const s = parsed.get(dir);
            if (!s?.ok) { stale.push(`${dir}: no longer parses or is gone`); continue; }
            for (const n of names)
                if (!s.read.has(n) || s.written.has(n)) stale.push(`${dir}: "${n}" no longer dangles`);
        }
        assert.deepEqual(stale, [], 'RATCHET: remove KNOWN_DANGLING entries that no longer reproduce.');
    });
});
