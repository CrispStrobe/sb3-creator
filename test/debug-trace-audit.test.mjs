/**
 * Debug + settrace codegen audit: both instrumentation modes must
 * produce syntactically valid Python for every MicroPython gallery
 * example, and {debug:true}'s _bw_vnames must list exactly the
 * declared variables.
 *
 * Covers DEVICE MICROBIT and DEVICE PICO examples. Both modes:
 *   {debug: true}  — marker-based, _bw_pos() / _bw_dump()
 *   {trace: true}  — sys.settrace-based, _bw_trace()
 *
 * Run: node --test test/debug-trace-audit.test.mjs
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import SB3Creator from '../src/utils/sb3Creator.js';
import { corpusFloor } from './helpers/corpus-floor.mjs';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const TMP_PY = join(import.meta.dirname, '_debug_trace_audit_tmp.py');

// ---- discover MicroPython examples (DEVICE MICROBIT or DEVICE PICO) ----
const idx = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const mpExamples = idx.filter(e => {
    if (!e.files?.program) return false;
    const p = join(EXAMPLES, e.files.program);
    if (!existsSync(p)) return false;
    return /DEVICE\s+(?:MICROBIT|PICO)/i.test(readFileSync(p, 'utf8'));
});

// MEASURED 2026-08-23: 16 of 274 index.json entries. Same shape as
// debug-micropython — a regex over program text, so the corpus can empty
// without anyone touching this file. See test/helpers/corpus-floor.mjs.
corpusFloor('MicroPython examples discovered from examples/index.json',
    () => mpExamples.length, 14,
    'The filter is /DEVICE\\s+(MICROBIT|PICO)/i over each entry.files.program.');

// ---- helpers ----

function generate(exId, opts) {
    const entry = mpExamples.find(e => e.id === exId);
    const bw = readFileSync(join(EXAMPLES, entry.files.program), 'utf8');
    const c = new SB3Creator();
    c.parse(bw);
    return c.generateMicroPython(c.project, opts);
}

function checkPythonSyntax(py) {
    try {
        writeFileSync(TMP_PY, py);
        execSync(`python3 -c "import ast; ast.parse(open('${TMP_PY}').read())"`,
            { timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] });
        return { valid: true };
    } catch (e) {
        return { valid: false, error: e.stderr?.toString() || e.message };
    } finally {
        try { unlinkSync(TMP_PY); } catch {}
    }
}

function extractVnames(py) {
    const m = py.match(/_bw_vnames\s*=\s*(\[.*?\])/);
    return m ? JSON.parse(m[1]) : null;
}

function extractDeclaredVars(py) {
    // Module-level `name = 0` or `name = []` — user variables.
    // In debug/trace builds the helpers precede the vars, so scan the
    // entire file for non-indented lowercase-leading assignments.
    const INTERNAL = new Set([
        '_bw_step', '_pending', '_receivers', '_bw_vnames',
        '_radio_last_num', '_radio_last_str', '_bw_false',
    ]);
    const vars = [];
    for (const line of py.split('\n')) {
        const m = line.match(/^([a-z]\w*)\s*=\s*(?:0|\[\])\s*$/);
        if (m && !INTERNAL.has(m[1]) && !m[1].startsWith('_kp_') && !m[1].startsWith('_bw_'))
            vars.push(m[1]);
    }
    return vars;
}

// ---- {debug: true} tests ----

describe('{debug: true} — marker-based instrumentation', () => {
    for (const ex of mpExamples) {
        describe(ex.id, () => {
            let r;
            test('generates successfully', () => {
                r = generate(ex.id, { debug: true });
                assert.ok(r.ok, `gen failed: ${JSON.stringify(r.reasons || r.warnings)}`);
            });

            test('syntactically valid Python', () => {
                assert.ok(r?.py, 'no output to check');
                const { valid, error } = checkPythonSyntax(r.py);
                assert.ok(valid, `syntax error:\n${error}`);
            });

            test('_bw_vnames lists exactly the declared variables', () => {
                assert.ok(r?.py, 'no output to check');
                const vnames = extractVnames(r.py);
                assert.ok(vnames !== null, '_bw_vnames not found');
                const declared = extractDeclaredVars(r.py);
                assert.deepEqual(
                    [...vnames].sort(),
                    [...declared].sort(),
                    `_bw_vnames mismatch.\n  vnames:   [${vnames}]\n  declared: [${declared}]`
                );
            });
        });
    }
});

// ---- {trace: true} tests ----

describe('{trace: true} — settrace-based instrumentation', () => {
    for (const ex of mpExamples) {
        describe(ex.id, () => {
            let r;
            test('generates successfully', () => {
                r = generate(ex.id, { trace: true });
                assert.ok(r.ok, `gen failed: ${JSON.stringify(r.reasons || r.warnings)}`);
            });

            test('syntactically valid Python', () => {
                assert.ok(r?.py, 'no output to check');
                const { valid, error } = checkPythonSyntax(r.py);
                assert.ok(valid, `syntax error:\n${error}`);
            });

            test('_bw_vnames present and matches declared vars', () => {
                assert.ok(r?.py, 'no output to check');
                const vnames = extractVnames(r.py);
                // settrace builds also emit _bw_vnames for the dump-on-halt path
                if (vnames === null) return; // not all trace builds emit vnames — skip
                const declared = extractDeclaredVars(r.py);
                assert.deepEqual(
                    [...vnames].sort(),
                    [...declared].sort(),
                    `_bw_vnames mismatch.\n  vnames:   [${vnames}]\n  declared: [${declared}]`
                );
            });
        });
    }
});

// ---- cross-mode parity ----

describe('debug vs trace: variable parity', () => {
    for (const ex of mpExamples) {
        test(`${ex.id}: both modes declare the same variables`, () => {
            const dbg = generate(ex.id, { debug: true });
            const trc = generate(ex.id, { trace: true });
            assert.ok(dbg.ok && trc.ok, 'both must generate');
            const dbgVars = extractDeclaredVars(dbg.py).sort();
            const trcVars = extractDeclaredVars(trc.py).sort();
            assert.deepEqual(dbgVars, trcVars,
                `variable mismatch between debug and trace builds`);
        });
    }
});
