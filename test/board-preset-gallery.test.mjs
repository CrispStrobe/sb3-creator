import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { corpusFloor } from './helpers/corpus-floor.mjs';

const ROOT = join(import.meta.dirname, '..', 'examples');
const INDEX = JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

const CASES = [
  {
    id: 'board-prechin-a2-learning-board',
    sha256: '77fe1a77ee3562a57b569754aa2c8a5155770abe4ea5807fbf747b3cb9c705c6',
    parts: 29,
    wires: 123,
    requiredKinds: ['stc_mcu', '74hc595', 'matrix8x8', 'keypad_4x4', 'ds1302', 'ds18b20', 'at24c02', 'char_lcd', 'xpt2046']
  }
];

// MEASURED 2026-09-28: one reviewed full-board preset. The structure checks
// below are generated from CASES, so an empty list would otherwise pass.
corpusFloor('reviewed full-board gallery presets', () => CASES.length, 1,
  'The gallery addition is the PRECHIN A2 preset; losing it must be visible.');

test('board presets retain their reviewed source bytes and full authored structure', () => {
  for (const expected of CASES) {
    const entry = INDEX.find(item => item.id === expected.id);
    assert.ok(entry, `${expected.id} is missing from examples/index.json`);
    assert.equal(entry.kind, 'circuit');
    assert.equal(entry.device, 'stc89c52rc');
    const bytes = readFileSync(join(ROOT, entry.files.circuit));
    assert.equal(sha256(bytes), expected.sha256, `${expected.id} no longer matches the reviewed CUI source`);
    const circuit = JSON.parse(bytes);
    assert.equal(circuit.parts.length, expected.parts);
    assert.equal(circuit.wires.length, expected.wires);
    const kinds = new Set(circuit.parts.map(part => part.kind));
    for (const kind of expected.requiredKinds) assert.ok(kinds.has(kind), `${expected.id} lost ${kind}`);
  }
});

test('board preset source provenance is visible to readers', () => {
  for (const expected of CASES) {
    const intro = readFileSync(join(ROOT, expected.id, 'intro.md'), 'utf8');
    assert.match(intro, /75e3058bd2481faebe8d8272dbbc74cee06cd0dc/);
    assert.match(intro, /There is no (?:program|bundled program)/);
  }
});
