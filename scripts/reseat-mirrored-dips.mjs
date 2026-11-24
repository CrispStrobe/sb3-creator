#!/usr/bin/env node
/**
 * Re-seat parts whose saved seat the canvas cannot draw as art, nets unchanged.
 *
 * bw-circuit-ui #155 / bw-parts #25 (2026-11-24) re-laid the DIP footprints:
 * most used to describe the chip seen from underneath (pins 1..N/2 in the row
 * above the gutter), a mirror image no real package can be seated as; now pin
 * 1 is bottom-left with the notch left. Saved circuits keep their saved
 * leadMaps, so the engine's nets did not move, but the canvas keeps a box for
 * every part whose saved seat its art cannot reach (scripts/lib/seated-art.mjs).
 *
 * For each such part this finds the seat under the current footprint that
 * occupies EXACTLY the same breadboard strips (half-columns), keeping as many
 * legs in their holes as possible, and whose art is clean. Moving pin p from
 * strip S to strip S' would short whatever else is in S' to p, so everything
 * else in the affected strips moves with its pin: every jumper end, tap-wire
 * end and other part's lead in strip S goes to the same row of S' (mirrored
 * through the gutter when S' is in the other block: a<->j, b<->i, … e<->f).
 * That is a permutation of the strips, so every net keeps exactly its
 * members. A file is written only if
 *
 *   - the engine's net partition is identical before and after, under both the
 *     gates' headless load and the app's load (every sidecar registered),
 *   - every re-seated part now draws as art, and no other part got worse,
 *   - every other seated part that moved still sits in a shape its footprint
 *     allows (some quarter turn of it, from some reference hole),
 *   - no hole is used twice that was not used twice before.
 *
 *   BW_BOARD=… BW_CIRCUIT_UI=… node scripts/reseat-mirrored-dips.mjs [--dry]
 *        [--files=a.json,b.json | examples/<id>/circuit*.json …]
 *
 * Without file arguments it runs over every examples/<id>/circuit*.json that
 * has a boxed part, EXCEPT generated lab benches and hand-authored lab benches
 * (scripts/lib/lab-bench-owners.mjs): those are re-laid by their generators
 * and scripts/seat-lab-benches.mjs, which seat with the current footprints.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { injectEngine, registerSidecars } from './lib/engine-surface.mjs';
import { netPartition, partitionDiff } from './lib/bench-layout.mjs';
import { loadSeatedArt } from './lib/seated-art.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const quiet = args.includes('--quiet');

// ---- the headless partition, from a child process (the registry is global) ----
if (args.includes('--headless-partitions')) {
    const E = await injectEngine();
    const files = JSON.parse(readFileSync(0, 'utf8'));
    const out = {};
    for (const [k, json] of Object.entries(files)) {
        try { out[k] = netPartition(E, json); } catch (e) { out[k] = [`LOAD FAILED: ${e.message}`]; }
    }
    // Exit only once the pipe has taken all of it: process.exit() right after
    // a large write to a pipe truncates it.
    process.stdout.write(JSON.stringify(out), () => process.exit(0));
    await new Promise(() => {});
}

const E = await injectEngine();
await registerSidecars(E.paths['bw-circuit-ui']);
const { seatedFaces } = await loadSeatedArt(E);
const { FOOTPRINTS, computeLeadMap, rotateFootprint } = await import(new URL('src/model/footprints.js', E.cuiURL).href);
const { holeWorldPos } = await import(new URL('src/interaction/seat-geometry.js', E.cuiURL).href);

const TOP = 'abcde', BOT = 'fghij';
const isTerm = (h) => /^[a-j]\d+$/.test(h);
const stripOf = (h) => isTerm(h) ? (TOP.includes(h[0]) ? 'T' : 'B') + h.slice(1) : null;
const MIRROR = { a: 'j', b: 'i', c: 'h', d: 'g', e: 'f', f: 'e', g: 'd', h: 'c', i: 'b', j: 'a' };

/** Hole h of strip `from` carried to strip `to`: same row, or mirrored through the gutter. */
function carry(h, to) {
    const row = stripOf(h)[0] === to[0] ? h[0] : MIRROR[h[0]];
    return row + to.slice(1);
}

/** Every leadMap of `fp` (any quarter turn, any reference hole) valid on `bb`. */
function* seatsOf(fp, bb, turns = [0, 1, 2, 3]) {
    const cols = 63;
    for (const q of turns) {
        const f = q ? rotateFootprint(fp, q) : fp;
        for (const r of 'abcdefghij') for (let c = 1; c <= cols; c++) {
            let lm;
            try { lm = computeLeadMap(f, `${r}${c}`); } catch { continue; }
            if (Object.values(lm).every(h => isTerm(h) && holeWorldPos(bb, h))) yield lm;
        }
    }
}

const sameMap = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v);

/** The headless net partitions of several circuits, from a child process. */
function headlessPartitions(files) {
    const out = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--headless-partitions'], {
        input: JSON.stringify(files), encoding: 'utf8', maxBuffer: 1 << 30, env: process.env,
    });
    return JSON.parse(out);
}

/** Holes used more than once: seats, jumper ends and tap-wire ends, per board. */
function doubleUse(json) {
    const seen = new Map();
    const use = (b, h) => { const k = `${b}:${h}`; seen.set(k, (seen.get(k) || 0) + 1); };
    for (const p of json.parts) if (p.seat) for (const h of Object.values(p.seat.leadMap)) use(p.seat.boardId, h);
    for (const w of json.holeWires || []) { use(w.boardId, w.a); use(w.boardId, w.b); }
    for (const w of json.wires || []) for (const e of [w.from, w.to]) if (e && typeof e === 'object' && e.board) use(e.board, e.hole);
    return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
}

/**
 * Re-seat every boxed part of one circuit. Returns {json, moved: [ids]} or
 * throws with the reason a file cannot be done this way.
 */
function reseat(before) {
    const faces = seatedFaces(before);
    const boxed = faces.filter(f => f.face === 'box').map(f => f.id);
    if (!boxed.length) return { json: before, moved: [] };
    const json = JSON.parse(JSON.stringify(before));
    const byId = new Map(json.parts.map(p => [p.id, p]));
    const boards = new Map(json.parts.filter(p => p.kind === 'breadboard').map(p => [p.id, p]));
    const holeMap = new Map();   // boardId -> Map(hole -> hole)
    const newSeat = new Map();   // part id -> leadMap

    for (const id of boxed) {
        const part = byId.get(id);
        const fp = FOOTPRINTS[part.kind];
        if (!fp) throw new Error(`${id} (${part.kind}): no footprint`);
        const bb = boards.get(part.seat.boardId);
        // A leadMap key the footprint no longer has is a renamed terminal the
        // loader migrates (attiny88 pa0 -> gnd2): pair it with the one new name.
        const old = { ...part.seat.leadMap };
        const gone = Object.keys(old).filter(k => !fp.leads[k]);
        const fresh = Object.keys(fp.leads).filter(k => !(k in old));
        if (gone.length === 1 && fresh.length === 1) { old[fresh[0]] = old[gone[0]]; delete old[gone[0]]; }
        else if (gone.length || fresh.length) throw new Error(`${id} (${part.kind}): saved legs ${gone} / footprint legs ${fresh} do not pair`);
        const strips = new Set(Object.values(old).map(stripOf));
        if (strips.size !== Object.keys(old).length) throw new Error(`${id}: two legs share a strip`);
        let best = null;
        for (const lm of seatsOf(fp, bb, [0])) {
            const s = new Set(Object.values(lm).map(stripOf));
            if (s.size !== strips.size || [...s].some(x => !strips.has(x))) continue;
            const kept = Object.keys(lm).filter(t => lm[t] === old[t]).length;
            const trial = JSON.parse(JSON.stringify(json));
            trial.parts.find(p => p.id === id).seat.leadMap = lm;
            if (seatedFaces(trial).find(f => f.id === id)?.face !== 'art') continue;
            if (!best || kept > best.kept) best = { lm, kept };
        }
        if (!best) throw new Error(`${id} (${part.kind}): no clean seat on the same strips`);
        newSeat.set(id, best.lm);
        const m = holeMap.get(bb.id) || new Map();
        holeMap.set(bb.id, m);
        for (const [t, h] of Object.entries(old)) {
            const from = stripOf(h), to = stripOf(best.lm[t]);
            if (from === to) continue;
            const rows = from[0] === 'T' ? TOP : BOT;
            for (const r of rows) {
                const src = r + from.slice(1);
                if (m.has(src)) throw new Error(`${id}: hole ${src} carried twice`);
                m.set(src, carry(src, to));
            }
        }
    }

    const move = (b, h) => holeMap.get(b)?.get(h) ?? h;
    for (const w of json.holeWires || []) { w.a = move(w.boardId, w.a); w.b = move(w.boardId, w.b); }
    for (const w of json.wires || []) {
        for (const e of [w.from, w.to]) if (e && typeof e === 'object' && e.board) e.hole = move(e.board, e.hole);
    }
    const carried = [];
    for (const p of json.parts) {
        if (!p.seat) continue;
        if (newSeat.has(p.id)) { p.seat.leadMap = newSeat.get(p.id); continue; }
        const lm = Object.fromEntries(Object.entries(p.seat.leadMap).map(([t, h]) => [t, move(p.seat.boardId, h)]));
        if (sameMap(lm, p.seat.leadMap)) continue;
        // A part carried along must still sit in a shape its footprint allows.
        const fp = FOOTPRINTS[p.kind];
        const bb = boards.get(p.seat.boardId);
        let ok = false;
        if (fp) for (const cand of seatsOf(fp, bb)) if (sameMap(cand, lm)) { ok = true; break; }
        if (!ok) throw new Error(`${p.id} (${p.kind}) shares a strip with a re-seated leg; carried to ${JSON.stringify(lm)} it is not a seat its footprint allows`);
        p.seat.leadMap = lm;
        carried.push(p.id);
    }
    // Saved x/y of a re-seated or carried part: the centroid of its holes,
    // which is where the canvas puts it (resolveSeatedParts).
    for (const id of [...newSeat.keys(), ...carried]) {
        const p = byId.get(id) && json.parts.find(q => q.id === id);
        const bb = boards.get(p.seat.boardId);
        const pts = Object.values(p.seat.leadMap).map(h => holeWorldPos(bb, h));
        const oldPts = Object.values(before.parts.find(q => q.id === id).seat.leadMap).map(h => holeWorldPos(bb, h));
        const c = (ps) => ({ x: ps.reduce((s, q) => s + q.x, 0) / ps.length, y: ps.reduce((s, q) => s + q.y, 0) / ps.length });
        const [a, b] = [c(oldPts), c(pts)];
        if (Math.hypot(a.x - b.x, a.y - b.y) > 1e-6) { p.x = Math.round(b.x * 100) / 100; p.y = Math.round(b.y * 100) / 100; }
    }

    // ---- checks (the headless partition is checked by the caller, batched) ----
    const diff = partitionDiff(netPartition(E, before), netPartition(E, json));
    if (diff.length) throw new Error(`app-load nets changed:\n      ${diff.slice(0, 8).join('\n      ')}`);
    const facesAfter = new Map(seatedFaces(json).map(f => [f.id, f.face]));
    for (const f of faces) {
        const now = facesAfter.get(f.id);
        if (boxed.includes(f.id) ? now !== 'art' : (f.face === 'art' && now !== 'art')) {
            throw new Error(`${f.id} (${f.kind}) draws as ${now} after the re-seat (was ${f.face})`);
        }
    }
    const dupBefore = doubleUse(before);
    const dupNew = [...doubleUse(json)].filter(k => !dupBefore.has(k));
    if (dupNew.length) throw new Error(`holes used twice after the re-seat: ${dupNew.join(' ')}`);
    return { json, moved: [...newSeat.keys()], carried };
}

// ---- which files ----
const listed = [
    ...args.filter(a => a.startsWith('--files=')).flatMap(a => a.slice(8).split(',')),
    ...args.filter(a => !a.startsWith('--')),
].filter(Boolean);
let files = listed;
if (!files.length) {
    const { GENERATED_LAB_BENCHES } = await import('./lib/lab-bench-owners.mjs');
    for (const d of readdirSync(join(ROOT, 'examples'), { withFileTypes: true })) {
        if (!d.isDirectory()) continue;
        for (const f of readdirSync(join(ROOT, 'examples', d.name))) {
            if (!/^circuit.*\.json$/.test(f)) continue;
            // Lab benches are laid out by their generators / seat-lab-benches.mjs.
            if (d.name.startsWith('lab-') && (f === 'circuit.json' || GENERATED_LAB_BENCHES.has(d.name))) continue;
            files.push(`examples/${d.name}/${f}`);
        }
    }
    files.sort();
}

/** Serialise like the file it replaces: its indent, its trailing newline. */
function sameFormat(text, json) {
    const indent = (text.match(/^\{\n( +)"/) || [, ''])[1].length;
    return JSON.stringify(json, null, indent || undefined) + (text.endsWith('\n') ? '\n' : '');
}

const pending = {};
let ok = 0, fail = 0, parts = 0, carriedN = 0;
for (const rel of files) {
    const before = JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
    if (!Array.isArray(before.parts)) continue;
    try {
        const { json, moved, carried = [] } = reseat(before);
        if (!moved.length) continue;
        pending[rel] = { before, json, moved, carried };
    } catch (e) {
        console.log(`  FAIL ${rel}: ${e.message}`);
        fail++;
    }
}
// Headless partitions, before and after, in one child process.
const keys = Object.keys(pending);
const hp = keys.length ? headlessPartitions(Object.fromEntries(keys.flatMap(k => [[`B ${k}`, pending[k].before], [`A ${k}`, pending[k].json]]))) : {};
for (const rel of keys) {
    const { json, moved, carried } = pending[rel];
    const diff = partitionDiff(hp[`B ${rel}`], hp[`A ${rel}`]);
    if (diff.length) {
        console.log(`  FAIL ${rel}: headless nets changed:\n      ${diff.slice(0, 8).join('\n      ')}`);
        fail++;
        continue;
    }
    if (!dry) writeFileSync(join(ROOT, rel), sameFormat(readFileSync(join(ROOT, rel), 'utf8'), json));
    if (!quiet) console.log(`  ok ${rel}: re-seated ${moved.join(' ')}${carried.length ? `; carried ${carried.join(' ')}` : ''}`);
    ok++; parts += moved.length; carriedN += carried.length;
}
console.log(`${ok} files ${dry ? 'would be ' : ''}re-seated (${parts} parts, ${carriedN} other parts carried with their strips), ${fail} failed`);
process.exitCode = fail ? 1 : 0;
