import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const BOARD_SIZE = {
  arduino_uno: [72.58 * 14 / 2.54, 53.34 * 14 / 2.54],
  arduino_nano: [44.9 * 14 / 2.54, 17.8 * 14 / 2.54],
  arduino_mega: [102.66 * 14 / 2.54, 50.8 * 14 / 2.54],
  pi_pico: [51 * 14 / 2.54, 21 * 14 / 2.54],
};
const POWER = {
  arduino_uno: {vcc: ['5v'], gnd: ['gnd', 'gnd2', 'gnd3']},
  arduino_nano: {vcc: ['5v'], gnd: ['gnd', 'gnd2']},
  arduino_mega: {vcc: ['5v'], gnd: ['gnd', 'gnd2', 'gnd3']},
  pi_pico: {vcc: ['vbus', 'vsys'], gnd: ['gnd_1', 'gnd_2', 'gnd_3', 'gnd_4', 'gnd_5']},
};

const endpoint = (wire, side) => {
  const value = wire[side];
  return value && typeof value === 'object'
    ? {part: value.part, terminal: value.terminal}
    : {part: value, terminal: wire[`${side}Terminal`]};
};
const touches = (wire, part, terminals) => {
  const a = endpoint(wire, 'from');
  const b = endpoint(wire, 'to');
  return (a.part === part && terminals.includes(a.terminal)) ||
    (b.part === part && terminals.includes(b.terminal));
};
const bounds = (part, width, height) => ({
  minX: part.x - width / 2, maxX: part.x + width / 2,
  minY: part.y - height / 2, maxY: part.y + height / 2,
});
const overlaps = (a, b) => a.minX < b.maxX && a.maxX > b.minX &&
  a.minY < b.maxY && a.maxY > b.minY;

test('generated controller benches have finite, non-overlapping, powered boards', () => {
  const failures = [];
  const files = fs.globSync('examples/*/circuit.*.json');
  for (const file of files) {
    const circuit = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const part of circuit.parts || []) {
      if (!Number.isFinite(part.x) || !Number.isFinite(part.y)) failures.push(`${file}: ${part.id} has invalid coordinates`);
    }
    const breadboards = (circuit.parts || []).filter(p => p.kind === 'breadboard');
    const boards = (circuit.parts || []).filter(p => BOARD_SIZE[p.kind] && !p.seat);
    for (const board of boards) {
      const bbounds = bounds(board, ...BOARD_SIZE[board.kind]);
      for (const breadboard of breadboards) {
        const cols = breadboard.params?.size === 'half' ? 30 : breadboard.params?.size === 'mini' ? 17 : 63;
        const width = (cols - 1) * 14 + 54;
        const height = breadboard.params?.size === 'mini' ? 218 : 310;
        if (overlaps(bbounds, bounds(breadboard, width, height))) {
          failures.push(`${file}: ${board.id} overlaps ${breadboard.id}`);
        }
      }
      const symbols = new Set((circuit.parts || []).filter(p => p.kind === 'vcc' || p.kind === 'gnd').map(p => p.kind));
      for (const supply of ['vcc', 'gnd']) {
        if (!symbols.has(supply)) continue;
        const wires = (circuit.wires || []).filter(w => touches(w, board.id, POWER[board.kind][supply]));
        if (wires.length === 0) failures.push(`${file}: ${board.id} has no ${supply} connection`);
        const generated = wires.filter(w => w.genPower);
        if (generated.length > 1) failures.push(`${file}: ${board.id} has duplicate generated ${supply} connections`);
      }
    }
  }
  assert.deepEqual(failures, []);
});
