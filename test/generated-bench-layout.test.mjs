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

test('all controller benches have finite, non-overlapping, powered boards', () => {
  const failures = [];
  // Include authored circuit.json as well as generated device variants.
  // The old suffix-only glob let legacy primary boards overlap forever.
  const files = fs.globSync('examples/*/circuit*.json');
  for (const file of files) {
    const circuit = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const part of circuit.parts || []) {
      if (!Number.isFinite(part.x) || !Number.isFinite(part.y)) failures.push(`${file}: ${part.id} has invalid coordinates`);
      if ((part.kind === 'arduino_uno' || part.kind === 'arduino_mega') && part.seat) {
        failures.push(`${file}: ${part.id} is physically unseatable but claims a breadboard seat`);
      }
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

test('all generated seated component bodies are disjoint in rendered geometry', async t => {
  const root = path.resolve(import.meta.dirname, '..');
  const cui = process.env.BW_CIRCUIT_UI || path.join(root, '..', 'bw-circuit-ui');
  if (!fs.existsSync(path.join(cui, 'src', 'interaction', 'hittest.js'))) {
    t.skip('needs a bw-circuit-ui checkout');
    return;
  }
  const {registerSidecar} = await import(path.join(cui, 'src/model/parts-registry.js'));
  for (const file of fs.readdirSync(path.join(cui, 'src/parts-data'))) {
    if (!file.endsWith('.json')) continue;
    try {
      const sidecar = JSON.parse(fs.readFileSync(path.join(cui, 'src/parts-data', file), 'utf8'));
      if (sidecar.kind) registerSidecar(sidecar);
    } catch { /* malformed sidecars have their own source-repo gate */ }
  }
  const {resolveSeatedParts} = await import(path.join(cui, 'src/interaction/seat-geometry.js'));
  const {partBounds} = await import(path.join(cui, 'src/interaction/hittest.js'));
  const failures = [];
  for (const file of fs.globSync('examples/*/circuit*.json')) {
    // Device variants are wholly generated and therefore held to exact body
    // packing. Primary circuit.json also contains compact, hand-authored
    // teaching layouts whose bent leads deliberately cross coarse AABBs.
    if (path.basename(file) === 'circuit.json') continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const parts = resolveSeatedParts(data.parts || []);
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i]; const b = parts[j];
      if (a.kind === 'breadboard' || b.kind === 'breadboard' || !a.seat || !b.seat ||
          a.seat.boardId !== b.seat.boardId) continue;
      const aa = partBounds(a); const bb = partBounds(b);
      const overlapX = Math.min(aa.maxX, bb.maxX) - Math.max(aa.minX, bb.minX);
      const overlapY = Math.min(aa.maxY, bb.maxY) - Math.max(aa.minY, bb.minY);
      if (overlapX > 1 && overlapY > 1) {
        failures.push(`${file}: ${a.id} (${a.kind}) overlaps ${b.id} (${b.kind}) by ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});
