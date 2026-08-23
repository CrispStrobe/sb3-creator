#!/usr/bin/env node
/**
 * Split a netId that labels TWO electrically separate nodes.
 *
 * THE DEFECT. A circuit.json wire carries a `netId`, and the model groups
 * the netlist BY that id — so two wires sharing an id are one node whether
 * or not they share a terminal. When a generator reuses an id across
 * unrelated wires, the supply rail and ground end up on one node, every
 * voltage collapses to 0 V, and the example is dead while still looking
 * plausible in the editor. pc82/83/85/88 each carried one; pc84-led-herz
 * carried the last one in the corpus (`net_12` held vcc_1.vcc AND
 * gnd_2.gnd, twelve wires that are really two nodes).
 *
 * THE REPAIR, and why it cannot change the circuit. Union-find over
 * TERMINAL MEMBERSHIP inside each netId: wires that actually touch stay
 * together, and a netId whose wires form more than one component is split.
 * The largest component keeps the id so the diff stays small and any
 * EXPECTED.md or test naming that id still names the same node. No wire,
 * no terminal and no part is added, removed or moved — only labels change,
 * and only where the label was describing two nodes as one.
 *
 * Endpoints are read through bw-circuit-ui's wire-endpoints.js, the one
 * canonical dialect reader: this corpus mixes the flat
 * ({from:'ID', fromTerminal:'t'}) and nested ({to:{board,hole}}) dialects
 * WITHIN A SINGLE FILE, and the hand-rolled union-find that assumed one
 * dialect is exactly what reported 802 phantom shorts.
 *
 * Usage:
 *   BW_CIRCUIT_UI=/path/to/bw-circuit-ui \
 *     node scripts/split-mislabelled-nets.mjs [--write] <circuit.json>...
 *
 * Without --write it reports and changes nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CUI = process.env.BW_CIRCUIT_UI;
if (!CUI) {
    console.error('set BW_CIRCUIT_UI to a bw-circuit-ui checkout — this script reads its ' +
        'canonical wire-endpoint accessor rather than hand-rolling a seventh copy of the ' +
        'dialect rule.');
    process.exit(2);
}
const { wireEndpoint, isBoardEndpoint } =
    await import(join(CUI, 'src/model/wire-endpoints.js'));

/** A stable key for one endpoint, across both dialects. */
function endpointKey (wire, side) {
    const e = wireEndpoint(wire, side);
    if (!e) return null;                                   // unreadable: never a shared node
    return isBoardEndpoint(e) ? `@bb:${e.board || e.boardId}:${e.hole}` : `${e.part}:${e.terminal}`;
}

/** Components of one netId's wires, by terminal membership. Largest first. */
function components (wires) {
    const parent = new Map();
    const find = (x) => {
        if (!parent.has(x)) parent.set(x, x);
        while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); }
        return x;
    };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    wires.forEach((w, i) => {
        const self = `#${i}`;
        find(self);
        for (const side of ['from', 'to']) {
            const k = endpointKey(w, side);
            if (k) union(self, k);
        }
    });
    const groups = new Map();
    wires.forEach((w, i) => {
        const r = find(`#${i}`);
        if (!groups.has(r)) groups.set(r, []);
        groups.get(r).push(w);
    });
    // Largest first; ties broken by the earliest wire so the result is
    // deterministic and a re-run is a no-op.
    return [...groups.values()].sort((a, b) =>
        b.length - a.length || wires.indexOf(a[0]) - wires.indexOf(b[0]));
}

const write = process.argv.includes('--write');
const files = process.argv.slice(2).filter((a) => a !== '--write');
let changedFiles = 0;

for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    const wires = data.wires || [];
    const byNet = new Map();
    for (const w of wires) {
        if (typeof w.netId !== 'string') continue;
        if (!byNet.has(w.netId)) byNet.set(w.netId, []);
        byNet.get(w.netId).push(w);
    }

    const taken = new Set(byNet.keys());
    const renames = [];
    for (const [netId, group] of byNet) {
        const comps = components(group);
        if (comps.length < 2) continue;
        // comps[0] keeps `netId`; every other component gets a fresh id.
        for (let n = 1; n < comps.length; n++) {
            let fresh = `${netId}_s${n}`;
            while (taken.has(fresh)) fresh += '_';
            taken.add(fresh);
            for (const w of comps[n]) renames.push({ wire: w, from: netId, to: fresh });
        }
        const shape = comps.map((c) => c.length).join(' + ');
        console.log(`${file}\n  ${netId}: ${group.length} wires are ${comps.length} nodes (${shape})`);
        comps.forEach((c, n) => {
            const terms = new Set();
            for (const w of c) for (const s of ['from', 'to']) { const k = endpointKey(w, s); if (k) terms.add(k); }
            console.log(`    [${n === 0 ? netId : `${netId}_s${n}`}] ${c.map((w) => w.id).join(', ')}`);
            console.log(`        ${[...terms].sort().join('  ')}`);
        });
    }

    if (!renames.length) continue;
    changedFiles++;
    if (!write) { console.log('  (dry run — pass --write to apply)'); continue; }
    for (const r of renames) r.wire.netId = r.to;
    // Preserve the file's own trailing newline convention.
    writeFileSync(file, JSON.stringify(data, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
    console.log(`  written: ${renames.length} wire(s) rehomed`);
}

console.log(`\n${changedFiles} file(s) ${write ? 'changed' : 'would change'} of ${files.length} scanned`);
