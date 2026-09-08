// Circuit-preserving retarget — shared by gen-device-benches (to write
// the transformed benches) and update-example-devices (to GATE the
// devices list on transformability: offering a device whose transform
// refuses would send the app to a bench that does not exist).
import { DEVPART } from './devpart.mjs';

/** Whether a gallery entry authorizes cross-device bench generation. */
export function isRetargetableExample(entry) {
  return allowsRetargeting(entry) && Array.isArray(entry?.devices) && entry.devices.length >= 2 &&
    (entry.kind === 'program' || entry.kind === 'full');
}

/** Whether catalog maintenance may recompute an entry across device families. */
export function allowsRetargeting(entry) {
  return entry?.retarget !== false;
}

// ── Circuit-preserving retarget ──────────────────────────────────────
// A device pick on an example WITH an authored circuit must not
// synthesize a generic bench: it transforms the authored circuit — every
// non-MCU part byte-identical (seats, positions, params), the MCU
// swapped to the target's designer kind and re-wired per retarget's
// pinMap. The retargetter used to replace the whole console with a rank
// of LEDs (owner report, 2026-08-17). Synthesis remains the fallback
// for examples with no authored circuit.

export const MCU_KINDS = new Set(['mcu', 'stc_mcu', 'stc15_mcu', ...Object.values(DEVPART)]);
const POWER_NAMES = new Set(['vcc', '5v', 'vdd', 'avcc', 'vbus', 'vsys', '3v3']);
const GROUND_NAMES = new Set(['gnd', 'gnd2', 'gnd3', 'vss', 'agnd', 'swd_gnd',
  'gnd_1', 'gnd_2', 'gnd_3', 'gnd_4', 'gnd_5', 'gnd_6', 'gnd_7']);
const POWER_EQUIV = {
  mcu: { power: 'VCC', ground: 'GND' },
  stc_mcu: { power: 'VCC', ground: 'GND' },
  stc15_mcu: { power: 'VCC', ground: 'GND' },
  arduino_uno: { power: '5v', ground: 'gnd' },
  arduino_nano: { power: '5v', ground: 'gnd' },
  arduino_mega: { power: '5v', ground: 'gnd' },
  pi_pico: { power: 'vsys', ground: 'gnd_1' },
  attiny88: { power: 'vcc', ground: 'gnd' },
  attiny85: { power: 'vcc', ground: 'gnd' },
  // Added 2026-09-04. `DEVPART` has carried `stm32f030` for some time and this
  // table did not, so `POWER_EQUIV[targetKind]` was undefined and every run of
  // update-example-devices.mjs died on the first authored circuit it reached:
  //   TypeError: Cannot read properties of undefined (reading 'ground')
  // — which meant the script the header calls "the single command that widening
  // the device family requires" could not be run at all, on main, by anyone.
  // Names taken from the part rather than guessed: bw-circuit-ui's
  // parts-data/stm32f030.json declares terminals `vcc`, `vcc2` and `gnd`, and
  // this is a board target so `caseTo` lowercases anyway.
  stm32f030: { power: 'vcc', ground: 'gnd' },
};

// A hole's electrical strip: rail name, or column + block half.
function stripKeyOf(hole) {
  const rail = /^([tb][+-])/.exec(hole);
  if (rail) return rail[1];
  const m = /^([a-j])(\d+)$/.exec(hole);
  if (!m) return hole;
  return `${'abcde'.includes(m[1]) ? 'T' : 'B'}${m[2]}`;
}

// The devices' FULL pin spaces. Allocation pools are curated teaching
// subsets (they exclude UART/ISP pins deliberately), but the console kit
// wires a button on P3.0 and pong's 28 declared pins alone exhaust any
// pool — circuit-only extras draw from the real header space, in a
// deterministic order, and refuse only on true exhaustion (an ATtiny85
// honestly cannot carry a console).
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
function fullPinSpace(device) {
  const p8051 = (ports) => Object.entries(ports).flatMap(([port, bits]) =>
    bits.map((b) => `P${port}.${b}`));
  switch (device) {
    case 'stc12c5a60s2':
      return p8051({ 0: range(0, 7), 1: range(0, 7), 2: range(0, 7), 3: range(0, 7), 4: [4, 5, 6, 7] });
    case 'stc89c52rc':
      return p8051({ 0: range(0, 7), 1: range(0, 7), 2: range(0, 7), 3: range(0, 7) });
    case 'stc15f2k60s2':
      return p8051({ 0: range(0, 7), 1: range(0, 7), 2: range(0, 7), 3: range(0, 7), 4: range(0, 7), 5: [4, 5] });
    case 'arduino-mega':
      return [...range(2, 13).map((n) => `D${n}`), ...range(22, 53).map((n) => `D${n}`),
        ...range(0, 15).map((n) => `A${n}`)];
    case 'arduino-uno': case 'atmega168p':
      return [...range(2, 13).map((n) => `D${n}`), ...range(0, 5).map((n) => `A${n}`)];
    case 'arduino-nano': // A6/A7 are analog-in ONLY — not in the digital space
      return [...range(2, 13).map((n) => `D${n}`), ...range(0, 5).map((n) => `A${n}`)];
    case 'pico':
      return [...range(0, 22).map((n) => `GP${n}`), ...range(26, 28).map((n) => `GP${n}`)];
    default: return null; // fall back to the pools
  }
}

const SERIES_TERMINALS = {
  resistor: ['a', 'b'],
  led: ['anode', 'cathode'],
};

/** Parse the retargeted program once, with a fail-closed pin-metadata result. */
export function parseRetargetedPins(SB3Creator, pseudocode) {
  try {
    const creator = new SB3Creator();
    creator.parse(pseudocode);
    const pins = creator.project?.stc?.pins;
    if (!Array.isArray(pins)) {
      return {ok: false, reason: 'retargeted program did not expose pin metadata'};
    }
    return {ok: true, pins};
  } catch (error) {
    return {ok: false, reason: `retargeted program pin parse failed: ${String(error?.message ?? error)}`};
  }
}

// Find simple LED branches from one MCU net to a supply rail. Generated lesson
// benches use a series resistor + LED (or a bare LED); refusing shared/branched
// interiors is safer than silently re-authoring a topology we did not prove.
function ledPathsFrom(nets, partsById, mcuId, startNet) {
  const netOf = new Map();
  const netById = new Map(nets.map(n => [n.id, n]));
  for (const net of nets) for (const t of net.terminals || []) {
    netOf.set(`${t.part}\0${t.terminal}`, net.id);
  }
  const railOf = net => (net.terminals || []).map(t => partsById.get(t.part))
    .find(p => p && (p.kind === 'vcc' || p.kind === 'gnd'));
  const found = [];
  const walk = (netId, chain, used) => {
    const net = netById.get(netId);
    if (!net) return;
    const rail = railOf(net);
    if (rail && chain.some(step => partsById.get(step.part)?.kind === 'led')) {
      found.push({chain, rail});
      return;
    }
    for (const t of net.terminals || []) {
      if (t.part === mcuId || used.has(t.part)) continue;
      const part = partsById.get(t.part);
      const terms = part && SERIES_TERMINALS[part.kind];
      if (!terms || !terms.includes(t.terminal)) continue;
      const far = terms[0] === t.terminal ? terms[1] : terms[0];
      const next = netOf.get(`${t.part}\0${far}`);
      if (!next) continue;
      const nextUsed = new Set(used);
      nextUsed.add(t.part);
      walk(next, [...chain, {part: t.part, near: t.terminal, far}], nextUsed);
    }
  };
  walk(startNet, [], new Set());
  return found;
}

function polarityRewrites(d, circ, mcu, pinMap, retargetedPins, caseTo) {
  if (!Array.isArray(retargetedPins)) return {rewrites: [], unsupported: [], endpointStrips: new Set()};
  const norm = t => String(t).toLowerCase();
  const coordOf = p => p.where ? String(p.where) : `P${p.port}.${p.bit}`;
  const targetPins = new Map(retargetedPins
    .filter(p => p.direction === 'output')
    .map(p => [norm(coordOf(p)), p]));
  const targetOf = new Map(pinMap.map(p => [norm(p.from), norm(p.to)]));
  const partsById = new Map(d.parts.map(p => [p.id, p]));
  const terminalNet = new Map();
  for (const net of circ.resolvedNets || []) for (const t of net.terminals || []) {
    terminalNet.set(`${t.part}\0${norm(t.terminal)}`, net.id);
  }
  const rewrites = [];
  const unsupported = [];
  const endpointStrips = new Set();
  const seenLeds = new Set();
  for (const [from, to] of targetOf) {
    const pin = targetPins.get(to);
    if (!pin) continue;
    const startNet = terminalNet.get(`${mcu.id}\0${from}`);
    if (!startNet) continue;
    for (const path of ledPathsFrom(circ.resolvedNets || [], partsById, mcu.id, startNet)) {
      const ledSteps = path.chain.filter(step => partsById.get(step.part)?.kind === 'led');
      if (ledSteps.length !== 1 || seenLeds.has(ledSteps[0].part)) continue;
      const currentLow = path.rail.kind === 'vcc';
      if (currentLow === !!pin.activeLow) continue;
      const led = ledSteps[0];
      const oriented = currentLow ? led.near === 'cathode' && led.far === 'anode'
        : led.near === 'anode' && led.far === 'cathode';
      if (!oriented) {
        unsupported.push(`${from}: LED ${led.part} has an unproved orientation`);
        continue;
      }
      // Interior nets may not branch. A shared net needs a circuit-specific
      // transform; treating it as a series chain would silently drop hardware.
      let simple = true;
      for (let i = 0; i < path.chain.length - 1; i++) {
        const netId = terminalNet.get(`${path.chain[i].part}\0${norm(path.chain[i].far)}`);
        const net = (circ.resolvedNets || []).find(n => n.id === netId);
        if (!net || net.terminals.length !== 2) { simple = false; break; }
      }
      if (!simple) {
        unsupported.push(`${from}: LED ${led.part} is on a shared branch`);
        continue;
      }
      const railKind = pin.activeLow ? 'vcc' : 'gnd';
      const rail = d.parts.find(p => p.kind === railKind);
      if (!rail) {
        unsupported.push(`${from}: polarity reversal requires a ${railKind} part`);
        continue;
      }
      const first = path.chain[0];
      const last = path.chain[path.chain.length - 1];
      rewrites.push({from, to: caseTo(coordOf(pin)), rail, railTerminal: railKind,
        chain: path.chain, first, last});
      seenLeds.add(led.part);
      for (const endpoint of [first, last]) {
        const part = partsById.get(endpoint.part);
        const hole = part?.seat?.leadMap?.[endpoint === first ? endpoint.near : endpoint.far];
        if (hole) endpointStrips.add(`${part.seat.boardId}:${stripKeyOf(hole)}`);
      }
    }
  }
  return {rewrites, unsupported, endpointStrips};
}

/** Align an already-targeted authored bench with the target program's output polarity. */
export function alignAuthoredBenchPolarity(data, Circuit, retargetedPins) {
  if (!Array.isArray(retargetedPins)) {
    return {ok: false, reason: 'LED polarity transform refused: missing retargeted pin metadata'};
  }
  const d = JSON.parse(JSON.stringify(data));
  const mcu = d.parts.find(p => MCU_KINDS.has(p.kind));
  if (!mcu) return {ok: false, reason: 'no MCU part in authored circuit'};
  // Some registered device models canonicalise terminal aliases in-place
  // while loading. Measurement must not rewrite part/seat metadata.
  const circ = Circuit.fromJSON(JSON.parse(JSON.stringify(d)));
  if (circ.netlistError) return {ok: false, reason: `authored circuit invalid: ${circ.netlistError}`};
  const isBoardTarget = !['mcu', 'stc_mcu', 'stc15_mcu'].includes(mcu.kind);
  const caseTo = t => isBoardTarget ? String(t).toLowerCase() : String(t);
  const coordOf = p => p.where ? String(p.where) : `P${p.port}.${p.bit}`;
  const identityMap = (retargetedPins || []).map(p => ({from: coordOf(p), to: coordOf(p)}));
  const polarity = polarityRewrites(d, circ, mcu, identityMap, retargetedPins, caseTo);
  if (polarity.unsupported.length) {
    return {ok: false, reason: `LED polarity transform refused: ${polarity.unsupported.join('; ')}`};
  }
  if (!polarity.rewrites.length) return {ok: true, out: d, polarityRewrites: 0};

  const norm = t => String(t).toLowerCase();
  const endpointKeys = new Set(polarity.rewrites.flatMap(r => [
    `${r.first.part}\0${norm(r.first.near)}`, `${r.last.part}\0${norm(r.last.far)}`
  ]));
  const endpointKey = (wire, side) => {
    const value = wire[side];
    if (typeof value === 'string') return `${value}\0${norm(wire[`${side}Terminal`])}`;
    if (value && value.part) return `${value.part}\0${norm(value.terminal)}`;
    return '';
  };
  d.wires = (d.wires || []).filter(w =>
    !endpointKeys.has(endpointKey(w, 'from')) && !endpointKeys.has(endpointKey(w, 'to')));
  // A seated bench has physical jumpers in addition to its logical wires.
  // Keep each jumpers' external end and move only its branch end to the
  // opposite terminal. Dropping the old jumpers would leave a logically valid
  // circuit that is visibly unwired in the designer.
  const partsById = new Map(d.parts.map(part => [part.id, part]));
  const touching = (boardId, hole) => (d.holeWires || []).flatMap((hw, index) => {
    if (hw.boardId !== boardId) return [];
    const strip = stripKeyOf(hole);
    return ['a', 'b'].filter(side => stripKeyOf(hw[side]) === strip)
      .map(side => ({index, side}));
  });
  const removeHoleWires = new Set();
  for (const r of polarity.rewrites) {
    const firstPart = partsById.get(r.first.part);
    const lastPart = partsById.get(r.last.part);
    const firstHole = firstPart?.seat?.leadMap?.[r.first.near];
    const lastHole = lastPart?.seat?.leadMap?.[r.last.far];
    const firstBoard = firstPart?.seat?.boardId;
    const lastBoard = lastPart?.seat?.boardId;
    const fromFirst = firstHole ? touching(firstBoard, firstHole) : [];
    const fromLast = lastHole ? touching(lastBoard, lastHole) : [];
    if (!lastHole || firstBoard !== lastBoard) {
      for (const {index} of fromFirst) removeHoleWires.add(index);
    } else {
      for (const {index, side} of fromFirst) d.holeWires[index][side] = lastHole;
    }
    if (!firstHole || firstBoard !== lastBoard) {
      for (const {index} of fromLast) removeHoleWires.add(index);
    } else {
      for (const {index, side} of fromLast) d.holeWires[index][side] = firstHole;
    }
  }
  d.holeWires = (d.holeWires || []).filter((_, index) => !removeHoleWires.has(index));
  for (const r of polarity.rewrites) {
    d.wires.push({from: mcu.id, fromTerminal: r.to,
      to: r.last.part, toTerminal: r.last.far});
    d.wires.push({from: r.rail.id, fromTerminal: r.railTerminal,
      to: r.first.part, toTerminal: r.first.near});
  }
  const check = Circuit.fromJSON(JSON.parse(JSON.stringify(d)));
  if (check.netlistError) return {ok: false, reason: `polarity-aligned circuit rejected: ${check.netlistError}`};
  return {ok: true, out: d, polarityRewrites: polarity.rewrites.length};
}

export function transformAuthored(data, targetKind, pinMap, Circuit, pools, device, retargetedPins) {
  const d = JSON.parse(JSON.stringify(data));
  const mcu = d.parts.find((p) => MCU_KINDS.has(p.kind));
  if (!mcu) return { ok: false, reason: 'no MCU part in authored circuit' };
  const isBoardTarget = !['mcu', 'stc_mcu', 'stc15_mcu'].includes(targetKind);
  const norm = (t) => String(t).toLowerCase();
  const map = new Map(pinMap.map((m) => [norm(m.from), m.to]));
  const equiv = POWER_EQUIV[targetKind];
  const caseTo = (t) => (isBoardTarget ? String(t).toLowerCase() : String(t));

  // Connectivity truth: rows, jumpers and wires unioned.
  const circ = Circuit.fromJSON(data);
  if (circ.netlistError) return { ok: false, reason: `authored circuit invalid: ${circ.netlistError}` };
  const nets = circ.resolvedNets || [];

  // Circuit-only pins: hardware the program never declares (the console
  // wires FIVE buttons, pong reads two). They carry over — the same
  // coordinate when the target's conventional pin space owns it
  // unclaimed, else the next free digital pool pin — and refuse only
  // when the pool is exhausted. Deterministic: iteration order is the
  // resolved-nets order, stable per input.
  const usedTargets = new Set(pinMap.map((m) => norm(m.to)));
  const space = fullPinSpace(device) || (pools?.digital || []);
  const spaceNorm = new Set(space.map(norm));
  const extraAssign = new Map();
  const xlate = (term) => {
    const t = norm(term);
    if (map.has(t)) return caseTo(map.get(t));
    if (POWER_NAMES.has(t)) return equiv.power;
    if (GROUND_NAMES.has(t)) return equiv.ground;
    if (extraAssign.has(t)) return extraAssign.get(t);
    // circuit-only extra: same coordinate when the target owns it
    // unclaimed, else the first unclaimed pin of the full space
    let nt = null;
    if (spaceNorm.has(t) && !usedTargets.has(t)) nt = caseTo(term);
    else for (const cand of space) {
      if (!usedTargets.has(norm(cand))) { nt = caseTo(cand); break; }
    }
    if (nt != null) { usedTargets.add(norm(nt)); extraAssign.set(t, nt); return nt; }
    return null;
  };

  // Strips the seated MCU's leads occupied — every jumper into them was
  // an MCU connection and is re-expressed as a logical wire below.
  const mcuStrips = new Set();
  if (mcu.seat) {
    for (const h of Object.values(mcu.seat.leadMap)) {
      mcuStrips.add(`${mcu.seat.boardId}:${stripKeyOf(h)}`);
    }
  }

  // One explicit wire from the mapped MCU terminal to EVERY other member
  // of its net (star): peripherals that met only in the MCU's strip stay
  // connected after the strip is vacated.
  const netWires = [];
  const seen = new Set();
  for (const n of nets) {
    const mcuTerms = n.terminals.filter((t) => t.part === mcu.id);
    if (!mcuTerms.length) continue;
    const others = n.terminals.filter((t) => t.part !== mcu.id);
    // A seated MCU puts EVERY lead on a strip, so an unconnected pin
    // still surfaces as a one-terminal net — nothing to carry, and
    // translating it would burn a target coordinate for nothing.
    if (!others.length) continue;
    for (const mt of mcuTerms) {
      const nt = xlate(mt.terminal);
      if (nt == null) {
        return { ok: false, reason:
          `MCU terminal ${mt.terminal} is wired but has no mapping on ${targetKind} — refusing rather than dropping the connection` };
      }
      for (const o of others) {
        const key = `${nt}|${o.part}|${o.terminal}`;
        if (seen.has(key)) continue;
        seen.add(key);
        netWires.push({ from: mcu.id, fromTerminal: nt, to: o.part, toTerminal: o.terminal });
      }
    }
  }

  // ACTIVE-HIGH inputs (a key wired to +) idle correctly on the RP2040
  // through its internal pull-DOWN — but the 8051's quasi-bidirectional
  // pins idle HIGH and the AVR has only internal pull-UPS, so on every
  // non-Pico target the transformed key would read PRESSED forever.
  // Synthesize the pull-down the real bench would need: 10k from the
  // pin's net to ground, one per active-high input that is actually
  // wired. (ACTIVE LOW inputs keep the pull-up idiom their emitters
  // already handle.)
  const pdParts = [];
  const pdWires = [];
  if (targetKind !== 'pi_pico' && Array.isArray(retargetedPins)) {
    const gndPart = d.parts.find((p) => p.kind === 'gnd');
    const coordOf = (q) => q.where ? String(q.where) : `P${q.port}.${q.bit}`;
    const wiredNew = new Set(netWires.map((w) => norm(w.fromTerminal)));
    for (const pin of retargetedPins) {
      if (pin.direction !== 'input' || pin.activeLow) continue;
      const nt = norm(caseTo(coordOf(pin)));
      if (!wiredNew.has(nt) || !gndPart) continue;
      const rId = `R_PD_${pin.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
      // 4.7k, not 10k: against the 8051's quasi weak pull-up (~20k) a
      // 10k divider idles at 1.58 V — a hair ABOVE the 1.5 V read
      // threshold, so the key still read pressed. 4.7k idles ~0.9 V.
      pdParts.push({ id: rId, kind: 'resistor', params: { ohms: 4700 },
        terminals: ['a', 'b'], x: 60, y: -120 - pdParts.length * 20, rotation: 0 });
      pdWires.push({ from: mcu.id, fromTerminal: caseTo(coordOf(pin)), to: rId, toTerminal: 'a' });
      pdWires.push({ from: rId, toTerminal: 'gnd', to: gndPart.id, fromTerminal: 'b' });
    }
  }

  const parts = d.parts.map((p) => {
    if (p.id !== mcu.id) return p;
    const q = { id: p.id, kind: targetKind, params: {}, x: 80, y: -60, rotation: 0 };
    if (targetKind === 'mcu' || targetKind === 'stc_mcu' || targetKind === 'stc15_mcu') {
      const terms = new Set([equiv.power, equiv.ground]);
      for (const w of netWires) if (w.from === mcu.id) terms.add(w.fromTerminal);
      q.terminals = [...terms];
    }
    return q;
  });

  const holeInMcuStrip = (e) => e && typeof e === 'object' && e.board
    && mcuStrips.has(`${e.board}:${stripKeyOf(e.hole)}`);
  const wires = (d.wires || []).filter((w) => {
    if (w.from === mcu.id || w.to === mcu.id) return false;
    if ((w.from && w.from.part === mcu.id) || (w.to && w.to.part === mcu.id)) return false;
    if (holeInMcuStrip(w.from) || holeInMcuStrip(w.to)) return false;
    return true;
  }).concat(netWires);

  const holeWires = (d.holeWires || []).filter((hw) =>
    !(mcuStrips.has(`${hw.boardId}:${stripKeyOf(hw.a)}`)
      || mcuStrips.has(`${hw.boardId}:${stripKeyOf(hw.b)}`)));

  parts.push(...pdParts);
  wires.push(...pdWires);
  const out = { vcc: d.vcc ?? 5, parts, wires, holeWires, generated: 'benchFor+authored' };
  const check = Circuit.fromJSON(out);
  if (check.netlistError) return { ok: false, reason: `transformed circuit rejected: ${check.netlistError}` };
  return alignAuthoredBenchPolarity(out, Circuit, retargetedPins);
}
