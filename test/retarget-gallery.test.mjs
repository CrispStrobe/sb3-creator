// Retarget gallery integration test.
//
// 1. Every generic program example's computed `devices` list matches a
//    dry-run of retargetPseudocode against every known device.
// 2. Where golden manual examples exist (nano01-blink, pico01-blink, ...),
//    the retarget output matches: same pins, same body, same device/clock.
//    Comments and STAGE: wrappers may differ (decompile artefact vs. hand-written).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join } from 'path';
import SB3Creator from '../src/utils/sb3Creator.js';

const EXAMPLES = join(import.meta.dirname, '..', 'examples');
const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
// The dry-run universe is RETARGET_POOLS minus the devices the bench
// generator cannot bench (scripts/gen-device-benches.mjs DEVPART has no
// board part for them yet). A computed `devices` list means "the app can
// offer this example on this device END TO END" — retarget alone is not
// that. eater6502/z80 were removed from 68 index lists as phantom for
// exactly this reason (77e2717); when they get designer board parts and
// DEVPART entries, delete them here and regenerate the lists.
const UNBENCHABLE = new Set(['eater6502', 'z80']);
const devices = Object.keys(SB3Creator.RETARGET_POOLS)
    .filter(d => !UNBENCHABLE.has(d));

// Programs with a computed `devices` field (generic, retargetable).
const generic = index.filter(e => e.kind === 'program' && Array.isArray(e.devices));

// ---- 1. Computed device lists match dry-run --------------------------------
describe('retarget-gallery: computed device lists are accurate', () => {
    for (const entry of generic) {
        test(`${entry.id}: devices list matches retarget dry-run`, () => {
            const src = readFileSync(join(EXAMPLES, entry.files.program), 'utf8');
            const expected = [];
            for (const dev of devices) {
                const r = SB3Creator.retargetPseudocode(src, dev);
                if (r.ok) expected.push(dev);
            }
            assert.deepEqual(entry.devices, expected,
                `${entry.id}: index.json devices disagrees with retargetPseudocode`);
        });
    }
});

// ---- 2. Every retarget result re-parses clean and emits C ------------------
describe('retarget-gallery: every retarget result is valid', () => {
    for (const entry of generic) {
        const src = readFileSync(join(EXAMPLES, entry.files.program), 'utf8');
        for (const dev of entry.devices) {
            test(`${entry.id} -> ${dev}: re-parses and generates C`, () => {
                const r = SB3Creator.retargetPseudocode(src, dev);
                assert.equal(r.ok, true, r.reasons.join('; '));
                const c = new SB3Creator();
                c.parse(r.pseudocode);
                assert.deepEqual(c.warnings, [], `re-parse warnings on ${dev}`);
                const out = c.generateC(undefined, {});
                assert.ok(out.length > 100, `${dev} emits non-trivial C`);
            });
        }
    }
});

// ---- 3. Golden fixture comparison ------------------------------------------
// The retarget output for a canonical example should produce the same pin
// assignments and body as the manually-written device-specific example.
// Only declarations and the body matter; comments are allowed to differ.

/**
 * The decompile output wraps the body in `STAGE:\n  WHEN ...` with +2 indent.
 * Golden fixtures have no STAGE wrapper. Normalize both to the same form:
 * strip STAGE:, de-indent its contents, strip comments, collapse blanks.
 */
function stripStage(text) {
    // If STAGE: appears, remove that line and de-indent everything after it by 2
    const stageRe = /^STAGE:\n/m;
    if (!stageRe.test(text)) return text;
    return text.replace(stageRe, '').replace(/^  /gm, '');
}

function normalizeBody(text) {
    const norm = stripStage(text);
    const whenIdx = norm.indexOf('WHEN');
    if (whenIdx < 0) return norm;
    return norm.slice(whenIdx)
        .replace(/#[^\n]*/g, '')
        .replace(/\n{2,}/g, '\n')
        .trim();
}

function normalizeDecls(text) {
    const norm = stripStage(text);
    const whenIdx = norm.indexOf('WHEN');
    if (whenIdx < 0) return norm.trim();
    return norm.slice(0, whenIdx)
        .replace(/#[^\n]*/g, '')
        .replace(/\n{2,}/g, '\n')
        .trim();
}

const GOLDEN_PAIRS = [
    // [canonical source id, device, golden target id]
    ['01-blink', 'pico', 'pico01-blink'],
    ['01-blink', 'arduino-nano', 'nano01-blink'],
];

// Add pot-print pair if the source has analog
const potSrc = index.find(e => e.id === '02-dimmer');
if (potSrc && potSrc.devices && potSrc.devices.includes('pico')) {
    // 02-dimmer uses analog — but the golden pico02-pot-print is a different program.
    // Only pair examples whose bodies are the same program.
}

describe('retarget-gallery: golden fixture comparison', () => {
    for (const [srcId, device, goldenId] of GOLDEN_PAIRS) {
        test(`retarget(${srcId}, ${device}) ~ ${goldenId}: same pins and body`, () => {
            const srcEntry = index.find(e => e.id === srcId);
            const goldenEntry = index.find(e => e.id === goldenId);
            assert.ok(srcEntry, `${srcId} not in index`);
            assert.ok(goldenEntry, `${goldenId} not in index`);

            const src = readFileSync(join(EXAMPLES, srcEntry.files.program), 'utf8');
            const golden = readFileSync(join(EXAMPLES, goldenEntry.files.program), 'utf8');
            const r = SB3Creator.retargetPseudocode(src, device);
            assert.equal(r.ok, true, r.reasons.join('; '));

            // Declarations: same DEVICE, CLOCK, PIN lines (modulo comments)
            const retargetDecls = normalizeDecls(r.pseudocode);
            const goldenDecls = normalizeDecls(golden);
            assert.equal(retargetDecls, goldenDecls,
                `declarations differ:\n  retarget: ${retargetDecls}\n  golden:   ${goldenDecls}`);

            // Body: the program logic is identical (modulo comments and STAGE wrapper)
            const retargetBody = normalizeBody(r.pseudocode);
            const goldenBody = normalizeBody(golden);
            assert.equal(retargetBody, goldenBody,
                `body differs:\n  retarget: ${retargetBody}\n  golden:   ${goldenBody}`);
        });
    }
});
