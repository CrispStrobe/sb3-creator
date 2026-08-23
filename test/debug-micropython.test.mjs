/**
 * Debug codegen audit: generateMicroPython(project, {debug: true})
 *
 * For every micro:bit gallery example:
 * (a) The DEBUG build must be syntactically valid Python (ast.parse).
 * (b) _bw_vnames must list exactly the declared variables/lists —
 *     no more, no fewer.
 *
 * Run: node --test test/debug-micropython.test.mjs
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import SB3Creator from '../src/utils/sb3Creator.js';
import { corpusFloor } from './helpers/corpus-floor.mjs';
import { checkPythonSyntax } from './helpers/python-syntax.mjs';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');

// ---- discover micro:bit examples ----
const idx = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
const mbExamples = idx.filter(e => {
    if (!e.files?.program) return false;
    const p = join(EXAMPLES, e.files.program);
    if (!existsSync(p)) return false;
    const bw = readFileSync(p, 'utf8');
    return /DEVICE\s+MICROBIT/i.test(bw);
});

// MEASURED 2026-08-23: 9 of 274 index.json entries. The corpus is DISCOVERED by
// regex over program text, which is the fragile half — rename the declaration
// keyword, or move a file out from under `files.program`, and this list empties
// while every `for (const ex of mbExamples)` below reports a clean pass over it.
corpusFloor('micro:bit examples discovered from examples/index.json',
    () => mbExamples.length, 8,
    'The filter is /DEVICE\\s+MICROBIT/i over each entry.files.program; an empty result means it stopped matching, not that micro:bit support went away.');

// ---- helpers ----

function generateDebug(exampleId) {
    const entry = mbExamples.find(e => e.id === exampleId);
    const bw = readFileSync(join(EXAMPLES, entry.files.program), 'utf8');
    const c = new SB3Creator();
    c.parse(bw);
    const r = c.generateMicroPython(c.project, { debug: true });
    // Also extract the declared variables from the non-debug build for comparison
    const c2 = new SB3Creator();
    c2.parse(bw);
    const rNormal = c2.generateMicroPython();
    return { ok: r.ok, py: r.py, warnings: r.warnings, normalPy: rNormal.py };
}

function extractVnames(py) {
    const m = py.match(/_bw_vnames\s*=\s*(\[.*?\])/);
    return m ? JSON.parse(m[1]) : null;
}

function extractDeclaredVars(py) {
    // State declarations are module-level `name = 0` or `name = []` lines.
    // In debug builds, the debug helpers appear BEFORE the user variables,
    // so we scan the entire file for non-indented assignments. Exclude
    // internal names (debug scaffolding, scheduler, keypad state).
    const INTERNAL = new Set(['_bw_step', '_pending', '_receivers', '_bw_vnames',
        '_radio_last_num', '_radio_last_str']);
    const lines = py.split('\n');
    const vars = [];
    for (const line of lines) {
        const m = line.match(/^([a-z]\w*)\s*=\s*(?:0|\[\])\s*$/);
        if (m && !INTERNAL.has(m[1]) && !m[1].startsWith('_kp_')) {
            vars.push(m[1]);
        }
    }
    return vars;
}


// ---- tests ----

describe('debug codegen audit: all micro:bit examples', () => {
    for (const ex of mbExamples) {
        describe(ex.id, () => {
            let debugResult;
            let setupError;
            try {
                debugResult = generateDebug(ex.id);
            } catch (e) {
                setupError = e.message;
            }

            test('debug build generates successfully', () => {
                assert.ok(!setupError, `setup failed: ${setupError}`);
                assert.ok(debugResult.ok, `generateMicroPython(debug) failed: ${JSON.stringify(debugResult.warnings)}`);
            });

            test('debug build is syntactically valid Python', () => {
                assert.ok(!setupError, `setup failed: ${setupError}`);
                const { valid, error } = checkPythonSyntax(debugResult.py);
                assert.ok(valid, `syntax error in debug build:\n${error}`);
            });

            test('_bw_vnames lists exactly the declared variables', () => {
                assert.ok(!setupError, `setup failed: ${setupError}`);
                const vnames = extractVnames(debugResult.py);
                assert.ok(vnames !== null, '_bw_vnames not found in debug output');
                const declared = extractDeclaredVars(debugResult.py);
                // _bw_vnames should contain exactly the user-declared vars
                assert.deepEqual(
                    [...vnames].sort(),
                    [...declared].sort(),
                    `_bw_vnames mismatch.\n` +
                    `  vnames:   [${vnames.join(', ')}]\n` +
                    `  declared: [${declared.join(', ')}]`
                );
            });

            test('_bw_dump function is present', () => {
                assert.ok(!setupError, `setup failed: ${setupError}`);
                assert.ok(debugResult.py.includes('def _bw_dump():'),
                    '_bw_dump() not found in debug output');
            });

            test('_bw_pos function is present', () => {
                assert.ok(!setupError, `setup failed: ${setupError}`);
                assert.ok(debugResult.py.includes('def _bw_pos('),
                    '_bw_pos() not found in debug output');
            });

            test('debug build contains \\x1eV serialization', () => {
                assert.ok(!setupError, `setup failed: ${setupError}`);
                assert.ok(debugResult.py.includes("'\\x1eV'"),
                    'missing \\x1eV variable dump in debug output');
            });

            test('debug build contains \\x1eB board snapshot (micro:bit)', () => {
                assert.ok(!setupError, `setup failed: ${setupError}`);
                assert.ok(debugResult.py.includes("'\\x1eB'"),
                    'missing \\x1eB board snapshot in debug output');
            });
        });
    }
});

describe('debug vs normal: variable parity', () => {
    for (const ex of mbExamples) {
        test(`${ex.id}: debug _bw_vnames matches normal build's vars`, () => {
            const { py: debugPy, normalPy } = generateDebug(ex.id);
            const vnames = extractVnames(debugPy);
            const normalVars = extractDeclaredVars(normalPy);
            // Every variable in the normal build should appear in _bw_vnames
            for (const v of normalVars) {
                assert.ok(vnames.includes(v),
                    `variable "${v}" declared in normal build but missing from _bw_vnames`);
            }
            // No extra names in _bw_vnames
            for (const v of vnames) {
                assert.ok(normalVars.includes(v),
                    `"${v}" in _bw_vnames but not declared in normal build`);
            }
        });
    }
});
