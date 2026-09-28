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
    // The shipped bytes, including the part placement added here.
    sha256: '357ba20d05c27c2e5bcd5e1f10b885a6a16ccc88844e0a2e4c49c9e438a089aa',
    // The reviewed CUI generator output. Its generator places every
    // part at (0,0), so it is exactly the shipped file with x/y zeroed.
    sourceSha256: '77fe1a77ee3562a57b569754aa2c8a5155770abe4ea5807fbf747b3cb9c705c6',
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
    assert.equal(sha256(bytes), expected.sha256, `${expected.id} changed without a review of this test`);
    const circuit = JSON.parse(bytes);
    const unplaced = structuredClone(circuit);
    for (const part of unplaced.parts) { part.x = 0; part.y = 0; }
    assert.equal(sha256(JSON.stringify(unplaced, null, 2) + '\n'), expected.sourceSha256,
      `${expected.id} differs from the reviewed CUI source in more than part placement`);
    assert.equal(circuit.parts.length, expected.parts);
    assert.equal(circuit.wires.length, expected.wires);
    const kinds = new Set(circuit.parts.map(part => part.kind));
    for (const kind of expected.requiredKinds) assert.ok(kinds.has(kind), `${expected.id} lost ${kind}`);
  }
});

test('board preset source provenance is visible to readers', () => {
  for (const expected of CASES) {
    for (const [name, source] of [['intro.md', /board-preset generator/], ['intro.de.md', /Board-Preset-Generator/]]) {
      const intro = readFileSync(join(ROOT, expected.id, name), 'utf8');
      assert.match(intro, source, `${expected.id}/${name} must name the generator it came from`);
      // A revision sha in reader prose goes stale the moment a consumer moves
      // its bw-circuit-ui pin, and Lite's pin-move gate reads it as a stale pin.
      assert.doesNotMatch(intro, /\b[0-9a-f]{40}\b/, `${expected.id}/${name} cites a revision sha`);
    }
    const intro = readFileSync(join(ROOT, expected.id, 'intro.md'), 'utf8');
    assert.match(intro, /There is no (?:program|bundled program)/);
  }
});

// Every part at the same point is how the preset arrived: 29 parts stacked at
// (0,0), which Lite's corpus gate reported as a potentiometer covering the
// board. Placement is checked here with the parts' hit-box footprints so the
// preset cannot regress to a pile.
const FOOTPRINT = {
  vcc: [36, 40], gnd: [36, 40], stc_mcu: [286, 52], '74hc595': [118, 52], matrix8x8: [118, 52],
  slide_switch: [48, 28], keypad_4x4: [56, 72], ds1302: [62, 52], ds18b20: [48, 48], at24c02: [62, 52],
  char_lcd: [160, 70], ir_receiver: [36, 44], buzzer: [48, 48], xpt2046: [88, 50], potentiometer: [60, 60],
  ntc: [40, 28], ldr: [40, 28], sevenseg8: [112, 68], ledbank8: [80, 30], button: [44, 52], resistor: [64, 20]
};

test('board presets place every part without overlap', () => {
  for (const expected of CASES) {
    const entry = INDEX.find(item => item.id === expected.id);
    const circuit = JSON.parse(readFileSync(join(ROOT, entry.files.circuit), 'utf8'));
    const boxes = circuit.parts.map(part => {
      const size = FOOTPRINT[part.kind];
      assert.ok(size, `${expected.id}: no footprint recorded for ${part.kind}`);
      const [w, h] = size;
      return { id: part.id, minX: part.x - w / 2, maxX: part.x + w / 2, minY: part.y - h / 2, maxY: part.y + h / 2 };
    });
    const overlaps = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (Math.min(a.maxX, b.maxX) > Math.max(a.minX, b.minX) && Math.min(a.maxY, b.maxY) > Math.max(a.minY, b.minY)) {
        overlaps.push(`${a.id}/${b.id}`);
      }
    }
    assert.deepEqual(overlaps, [], `${expected.id} has overlapping parts`);
    for (const box of boxes) assert.ok(box.minX >= 0 && box.minY >= 0, `${expected.id}: ${box.id} is placed off-canvas`);
  }
});
