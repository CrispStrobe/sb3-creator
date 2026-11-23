/**
 * Breadboard layout for lab benches: a netlist in, a buildable board out.
 *
 * One seating and routing core for every `lab-*` bench, whether a generator
 * describes it (scripts/gen-lab-circuits-4.mjs, scripts/gen-lab-batch2.mjs) or
 * it was authored by hand (scripts/seat-lab-benches.mjs reads the committed
 * circuit.json, takes its netlist from the engine and lays it out again).
 *
 * What a laid-out bench looks like, and why:
 *
 *   - every part that has a breadboard footprint a HEADLESS load honours is
 *     seated: bw-circuit-ui's builtin footprints plus the chips whose sidecars
 *     `injectEngine` registers (SIDECAR_FOOTPRINT_KINDS). A footprint only the
 *     browser knows would seat a part that the gates then load on no net;
 *   - bench instruments and supplies (OFF_BOARD_KINDS) stay off the board, in a
 *     row above it, ordered by where they connect, and reach it with tap wires;
 *   - parts go left to right in the order the bench lists them (its signal
 *     flow), alternating between the top block (leads in row a) and the bottom
 *     block (leads in row j); ICs straddle the gutter and take both blocks;
 *     potentiometers sit in the top block, where their knob rises over the
 *     rails and nothing else;
 *   - every lead has a strip of its own, so nothing is joined by accident; a
 *     net is a chain of jumpers between its strips, left to right, and the two
 *     supply nets are jumpers to the nearest rail hole;
 *   - no two bodies (or a body and a potentiometer knob) overlap: a part that
 *     would is moved right until it does not;
 *   - a bench that does not fit one full-size board continues on a second one
 *     below it, joined by visible board-to-board wires.
 *
 * Part-to-part wires are written ONLY between two unseated parts (an
 * instrument on a source, say), where the canvas draws them. A seated part is
 * never joined by one: the canvas does not draw those, and the board looked
 * unwired (test/lab-breadboard-layout.test.mjs).
 *
 * `layoutBench` checks its own output before returning it: the engine's net
 * partition of the laid-out file must equal the declared netlist exactly.
 */
import { injectEngine, registerSidecars, SIDECAR_FOOTPRINT_KINDS } from './engine-surface.mjs';

/**
 * Kinds that stay off the board in a lab bench: instruments a learner holds
 * (meters, scope, signal generator) and supplies (bench sources, batteries,
 * the supply symbols). Every other kind with a headless footprint is seated.
 * test/lab-breadboard-layout.test.mjs holds the gallery to this same list.
 */
export const OFF_BOARD_KINDS = Object.freeze([
    'voltmeter', 'ammeter', 'multimeter', 'analog_meter', 'oscilloscope', 'function_gen',
    'vsource', 'battery', 'battery_9v', 'potato_battery', 'vcc', 'gnd',
]);

const BOARD = { x: 520, y: 420, dy: 340, cols: 63, width: 62 * 14 + 54, height: 310 };
const SIGNAL_COLOURS = ['blue', 'green', 'yellow', 'orange', 'purple', 'white'];
const SUPPLY_KINDS = new Set(['vsource', 'battery', 'battery_9v', 'potato_battery']);

/** Load the engine plus the geometry the layout needs. */
export async function loadLayoutEngine() {
    const eng = await injectEngine();
    const url = (p) => new URL(p, eng.cuiURL).href;
    const fp = await import(url('src/model/footprints.js'));
    // Builtins are what Object.keys sees; the proxy also answers registered
    // sidecars. Taken BEFORE every sidecar is registered below.
    const builtin = new Set(Object.keys(fp.FOOTPRINTS));
    // Body sizes (partBounds) come from the sidecars, as in the app and in
    // test/generated-bench-layout.test.mjs. Seating does not: see seatable().
    await registerSidecars(eng.paths['bw-circuit-ui']);
    const { resolveSeatedParts } = await import(url('src/interaction/seat-geometry.js'));
    const { partBounds } = await import(url('src/interaction/hittest.js'));
    const { BreadboardModel } = await import(url('src/model/breadboard.js'));
    return { ...eng, FOOTPRINTS: fp.FOOTPRINTS, computeLeadMap: fp.computeLeadMap, builtin,
        resolveSeatedParts, partBounds, BreadboardModel };
}

/** The engine's net partition of a circuit: sorted "part.terminal" lists, singletons dropped. */
export function netPartition(E, json) {
    const c = E.Circuit.fromJSON(JSON.parse(JSON.stringify(json)));
    return c.board.getNets()
        .map(n => [...new Set(n.terminals.map(t => `${t.part}.${t.terminal}`))].sort())
        .filter(n => n.length > 1)
        .map(n => n.join(' '))
        .sort();
}

/** Compare two partitions; returns a list of human-readable differences. */
export function partitionDiff(want, got) {
    const a = new Set(want), b = new Set(got);
    return [...want.filter(n => !b.has(n)).map(n => `missing net: ${n}`),
        ...got.filter(n => !a.has(n)).map(n => `extra net:   ${n}`)];
}

/** The netlist of a committed circuit, as the engine sees it. */
export function netlistOf(E, json) {
    return netPartition(E, json).map(n => n.split(' '));
}

const canonCache = new Map();
/** The kind a load turns `kind` into (timer_555 -> 555, battery -> vsource). */
function canonicalKind(E, kind) {
    if (!canonCache.has(kind)) {
        let k = kind;
        try {
            const c = E.Circuit.fromJSON({ vcc: 5, parts: [{ id: 'x', kind, params: {}, x: 0, y: 0 }], wires: [] });
            k = c.parts[0]?.kind || kind;
        } catch { /* keep the saved kind */ }
        canonCache.set(kind, k);
    }
    return canonCache.get(kind);
}

/** The footprint a headless load honours for this kind, or null. */
export function seatableFootprint(E, kind) {
    if (OFF_BOARD_KINDS.includes(kind)) return null;
    const canon = canonicalKind(E, kind);
    for (const k of [kind, canon]) {
        if (E.builtin.has(k) || SIDECAR_FOOTPRINT_KINDS.includes(k)) {
            const fp = E.FOOTPRINTS[k];
            if (fp) return fp;
        }
    }
    return null;
}

const overlapOf = (a, b) => [Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX),
    Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)];
const collide = (a, b, gap) => { const [x, y] = overlapOf(a, b); return x > -gap && y > -gap; };

/**
 * The boxes a resolved part covers: its body, plus a potentiometer's knob (a
 * box 60·s wide centred on the part, 60·s tall above its `a` lead, s =
 * min(|b.x − a.x| / 40, 1.4) — drawn by bw-circuit-ui, checked by
 * test/generated-bench-layout.test.mjs).
 */
export function coverOf(E, part) {
    const boxes = [E.partBounds(part)];
    if (part.kind === 'potentiometer' && part.seat) {
        const a = part._seatTerminals?.a, b = part._seatTerminals?.b;
        if (a && b) {
            const s = Math.min(Math.abs(b.x - a.x) / 40, 1.4);
            boxes.push({ minX: part.x - 30 * s, maxX: part.x + 30 * s, minY: a.y - 60 * s, maxY: a.y });
        }
    }
    return boxes;
}

/**
 * Lay out one bench.
 *
 * spec = {
 *   vcc,                      // the circuit's vcc field
 *   parts: [partObject, …],   // as in circuit.json, ids final; breadboards ignored
 *   nets: [['id.term', …], …],
 *   supply: {pos, neg},       // optional 'id.term' on the rail nets; inferred if absent
 *   boardId: 'bb1',           // id of the first breadboard
 *   extra: {…},               // other top-level circuit.json fields, kept
 * }
 * Returns the circuit JSON. Throws if the result's nets differ from spec.nets.
 */
export function layoutBench(E, spec) {
    const parts = spec.parts.filter(p => p.kind !== 'breadboard').map(p => ({ ...p }));
    const byId = new Map(parts.map(p => [p.id, p]));
    const nets = spec.nets.map(n => [...new Set(n)]);
    for (const n of nets) for (const m of n) {
        if (!byId.has(m.split('.')[0])) throw new Error(`net member ${m} names no part`);
    }
    const boardId0 = spec.boardId || 'bb1';
    const boards = [];
    const addBoard = () => {
        const i = boards.length;
        const id = i === 0 ? boardId0 : `${boardId0}_${i + 1}`;
        const part = { id, kind: 'breadboard', params: {}, terminals: [], x: BOARD.x, y: BOARD.y + i * BOARD.dy, rotation: 0 };
        const b = { i, id, part, model: new E.BreadboardModel({}), top: 3, bot: 3, used: new Set(), strips: new Set(), boxes: [] };
        boards.push(b);
        return b;
    };
    addBoard();

    // ---- seat, left to right in the bench's own order ----
    const seatOf = new Map();   // part id -> board
    const leadAt = new Map();   // 'id.term' -> {b, hole}
    const resolve = (b, part) => E.resolveSeatedParts([b.part, part])[1];
    const tryAt = (b, part, fp, ref) => {
        let lm;
        try { lm = E.computeLeadMap(fp, ref); } catch { return null; }
        const holes = Object.values(lm);
        if (!holes.every(h => b.model.isValidHole(h))) return null;
        const strips = holes.map(h => ('abcde'.includes(h[0]) ? 't' : 'b') + h.slice(1));
        if (strips.some(s => b.strips.has(s))) return null;
        const placed = resolve(b, { ...part, seat: { boardId: b.id, leadMap: lm } });
        const boxes = coverOf(E, placed);
        if (boxes.some(x => b.boxes.some(y => collide(x, y, 3)))) return null;
        return { lm, strips, boxes, placed };
    };
    const place = (b, part, fp) => {
        const leads = Object.values(fp.leads);
        const span = Math.max(...leads.map(o => o.dCol));
        const maxRow = Math.max(...leads.map(o => o.dRow));
        const knob = part.kind === 'potentiometer';
        const tries = fp.straddlesGutter ? ['both']
            : (knob || maxRow > 0) ? ['top']
            : b.top <= b.bot ? ['top', 'bottom'] : ['bottom', 'top'];
        for (const blk of tries) {
            let col = blk === 'both' ? Math.max(b.top, b.bot) : blk === 'top' ? b.top : b.bot;
            for (; col + span <= BOARD.cols; col++) {
                const ref = blk === 'both' ? `e${col}` : blk === 'top' ? `a${col}` : `${'abcdefghij'[9 - maxRow]}${col}`;
                const got = tryAt(b, part, fp, ref);
                if (!got) continue;
                const next = col + span + 2;
                if (blk !== 'bottom') b.top = next;
                if (blk !== 'top') b.bot = next;
                return got;
            }
        }
        return null;
    };
    for (const part of parts) {
        const fp = seatableFootprint(E, part.kind);
        if (!fp) { delete part.seat; continue; }
        let b = boards.at(-1);
        let got = place(b, part, fp);
        if (!got) { b = addBoard(); got = place(b, part, fp); }
        if (!got) throw new Error(`${part.id} (${part.kind}) does not fit an empty board`);
        part.seat = { boardId: b.id, leadMap: got.lm };
        part.x = Math.round(got.placed.x * 100) / 100;
        part.y = Math.round(got.placed.y * 100) / 100;
        for (const s of got.strips) b.strips.add(s);
        b.boxes.push(...got.boxes);
        for (const [t, h] of Object.entries(got.lm)) { leadAt.set(`${part.id}.${t}`, { b, hole: h }); b.used.add(h); }
        seatOf.set(part.id, b);
    }
    // A lead the netlist names by an alias (the engine's spelling) still has
    // ONE leg: look it up through the loaded part's terminal list.
    const lead = (m) => leadAt.get(m) || null;
    const colOf = (h) => Number(h.replace(/^[a-j]|^[tb][+-]/, ''));

    // ---- supply nets ----
    const memberKind = (m) => byId.get(m.split('.')[0]).kind;
    const seatedCount = (n) => n.filter(m => lead(m)).length;
    let pos = null, neg = null;
    if (spec.supply) {
        pos = nets.find(n => n.includes(spec.supply.pos)) || null;
        neg = nets.find(n => n.includes(spec.supply.neg)) || null;
    } else {
        neg = nets.find(n => n.some(m => memberKind(m) === 'gnd')) || null;
        pos = nets.find(n => n !== neg && n.some(m => memberKind(m) === 'vcc')) || null;
        const best = (term, not) => nets.filter(n => n !== not && n.some(m => SUPPLY_KINDS.has(memberKind(m)) && m.endsWith(`.${term}`)))
            .sort((x, y) => seatedCount(y) - seatedCount(x))[0] || null;
        if (!neg) neg = best('neg', pos);
        if (!pos) pos = best('pos', neg);
    }
    if (pos && !seatedCount(pos)) pos = null;
    if (neg && !seatedCount(neg)) neg = null;

    // ---- off-board parts: a row above the first board, ordered by where they connect ----
    const offboard = parts.filter(p => !p.seat);
    const anchor = new Map();
    for (const p of offboard) {
        const cols = [];
        for (const n of nets) if (n.some(m => m.startsWith(`${p.id}.`))) {
            for (const m of n) { const L = lead(m); if (L && L.b.i === 0) cols.push(colOf(L.hole)); }
        }
        anchor.set(p.id, cols.length ? Math.min(...cols) : 0);
    }
    offboard.sort((x, y) => anchor.get(x.id) - anchor.get(y.id));
    {
        const b0 = boards[0];
        const boardTop = b0.part.y - BOARD.height / 2;
        const knobTop = Math.min(boardTop, ...b0.boxes.map(x => x.minY));
        let cx = b0.part.x - BOARD.width / 2, rowBottom = knobTop - 24, rowH = 0;
        for (const p of offboard) {
            const bx = E.partBounds({ ...p, x: 0, y: 0, rotation: 0 });
            const w = bx.maxX - bx.minX, h = bx.maxY - bx.minY;
            if (cx + w > b0.part.x + BOARD.width / 2 && cx > b0.part.x - BOARD.width / 2) {
                cx = b0.part.x - BOARD.width / 2; rowBottom -= rowH + 24; rowH = 0;
            }
            p.rotation = 0;
            p.x = Math.round(cx - bx.minX);
            p.y = Math.round(rowBottom - bx.maxY);
            cx += w + 24; rowH = Math.max(rowH, h);
        }
    }

    // ---- wiring ----
    const holeWires = [];
    const wires = [];
    let nw = 0;
    const take = (b, h) => {
        if (!b.model.isValidHole(h) || b.used.has(h)) throw new Error(`hole ${h} on ${b.id} is not free`);
        b.used.add(h);
        return h;
    };
    const free = (b, h, prefer) => {
        const top = 'abcde'.includes(h[0]);
        const rows = prefer === 'rail' ? (top ? 'bcdea' : 'ihgfj') : (top ? 'edcba' : 'fghij');
        for (const r of rows) { const x = r + h.slice(1); if (!b.used.has(x)) return x; }
        return null;
    };
    const freeCount = (L) => { const top = 'abcde'.includes(L.hole[0]); return [...(top ? 'abcde' : 'fghij')].filter(r => !L.b.used.has(r + L.hole.slice(1))).length; };
    const railHole = (b, rail, col) => {
        for (let k = 0; k < BOARD.cols * 2; k++) {
            const n = col + (k % 2 ? -(k + 1) / 2 : k / 2);
            if (n < 1 || n > BOARD.cols) continue;
            if (!b.used.has(rail + n)) return rail + n;
        }
        throw new Error(`rail ${rail} on ${b.id} is full`);
    };
    const jump = (b, x, y, color) => {
        take(b, x); take(b, y);
        nw++;
        holeWires.push({ ref: `bbw:${b.id}:bbw_${nw}`, boardId: b.id, a: x, b: y, color });
    };
    const tap = (m, b, hole, color) => {
        const [part, ...t] = m.split('.');
        take(b, hole);
        nw++;
        wires.push({ id: `w_${nw}`, netId: `net_${nw}`, from: { part, terminal: t.join('.') }, to: { board: b.id, hole }, ...(color ? { color } : {}) });
    };
    const bridge = (b1, h1, b2, h2, color) => {
        take(b1, h1); take(b2, h2);
        nw++;
        wires.push({ id: `w_${nw}`, netId: `net_${nw}`, from: { board: b1.id, hole: h1 }, to: { board: b2.id, hole: h2 }, color });
    };
    const direct = (m1, m2) => {
        const [p1, ...t1] = m1.split('.'); const [p2, ...t2] = m2.split('.');
        nw++;
        wires.push({ id: `w_${nw}`, netId: `net_${nw}`, from: { part: p1, terminal: t1.join('.') }, to: { part: p2, terminal: t2.join('.') } });
    };
    const xOfHole = (b, h) => b.part.x - BOARD.width / 2 + 27 + (colOf(h) - 1) * 14;

    // Rails: top/bottom of the same sign bridged at the left end, only where used.
    const railUse = boards.map(() => ({}));
    for (const [net, sign] of [[pos, '+'], [neg, '-']]) {
        if (!net) continue;
        for (const m of net) {
            const L = lead(m); if (!L) continue;
            railUse[L.b.i][('abcde'.includes(L.hole[0]) ? 't' : 'b') + sign] = true;
        }
    }
    boards.forEach((b, i) => {
        if (railUse[i]['t+'] && railUse[i]['b+']) jump(b, 't+1', 'b+1', 'red');
        if (railUse[i]['t-'] && railUse[i]['b-']) jump(b, 't-2', 'b-2', 'black');
    });

    let colour = 0;
    for (const net of nets) {
        const sign = net === pos ? '+' : net === neg ? '-' : null;
        const seated = net.filter(m => lead(m)).map(m => ({ m, ...lead(m) }))
            .sort((x, y) => x.b.i - y.b.i || colOf(x.hole) - colOf(y.hole));
        const loose = net.filter(m => !lead(m));
        if (sign) {
            const color = sign === '+' ? 'red' : 'black';
            const railOn = new Map();   // board -> a rail hole carrying this net
            for (const L of seated) {
                const rail = ('abcde'.includes(L.hole[0]) ? 't' : 'b') + sign;
                const from = free(L.b, L.hole, 'rail');
                if (!from) throw new Error(`strip of ${L.m} is full`);
                const to = railHole(L.b, rail, colOf(L.hole));
                jump(L.b, from, to, color);
                if (!railOn.has(L.b)) railOn.set(L.b, rail);
            }
            const onBoards = [...railOn.keys()].sort((x, y) => x.i - y.i);
            for (let i = 1; i < onBoards.length; i++) {
                const a = onBoards[0], z = onBoards[i];
                bridge(a, railHole(a, railOn.get(a), BOARD.cols), z, railHole(z, railOn.get(z), BOARD.cols), color);
            }
            const b0 = onBoards[0];
            for (const m of loose) {
                const p = byId.get(m.split('.')[0]);
                const col = Math.max(1, Math.min(BOARD.cols, Math.round((p.x - (b0.part.x - BOARD.width / 2) - 27) / 14) + 1));
                tap(m, b0, railHole(b0, railOn.get(b0), col), color);
            }
            continue;
        }
        const color = SIGNAL_COLOURS[colour++ % SIGNAL_COLOURS.length];
        if (!seated.length) {
            for (let i = 1; i < loose.length; i++) direct(loose[0], loose[i]);
            continue;
        }
        for (let i = 1; i < seated.length; i++) {
            const A = seated[i - 1], B = seated[i];
            const x = free(A.b, A.hole), y = free(B.b, B.hole);
            if (!x || !y) throw new Error(`strip of ${!x ? A.m : B.m} is full`);
            if (A.b === B.b) jump(A.b, x, y, color);
            else bridge(A.b, x, B.b, y, color);
        }
        for (const m of loose) {
            const p = byId.get(m.split('.')[0]);
            const near = seated.filter(L => L.b.i === 0 && freeCount(L) > 0).length
                ? seated.filter(L => L.b.i === 0 && freeCount(L) > 0) : seated.filter(L => freeCount(L) > 0);
            if (!near.length) throw new Error(`no free hole on the net of ${m}`);
            near.sort((x, y) => Math.abs(xOfHole(x.b, x.hole) - p.x) - Math.abs(xOfHole(y.b, y.hole) - p.x));
            const L = near[0];
            tap(m, L.b, free(L.b, L.hole), color);
        }
    }

    const json = {
        ...(spec.extra || {}),
        vcc: spec.vcc,
        parts: [...boards.map(b => b.part), ...parts],
        wires,
        holeWires,
    };

    // ---- self-check: the laid-out nets are exactly the declared ones ----
    const want = nets.filter(n => n.length > 1).map(n => [...n].sort().join(' ')).sort();
    const diff = partitionDiff(want, netPartition(E, json));
    if (diff.length) throw new Error(`layout changed the nets:\n    ${diff.join('\n    ')}`);
    return json;
}
