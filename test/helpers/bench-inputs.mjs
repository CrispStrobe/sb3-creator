/**
 * The inputs a bench can be PUT in beyond buttons, pots and supplies: slide
 * switches, DIP switches, a Hall sensor's field, a reed switch's magnet, and the
 * light falling on a phototransistor, a photodiode or an LDR.
 *
 * WHY THESE WERE DECLINED, AND WHAT DRIVES THEM
 * ---------------------------------------------
 * The census routed a claim to an operating point only through
 * `BoardImpl.setControl`, the 0..1 knob that buttons, pots, LDRs and NTCs read.
 * The parts here are DEVICE MODELS, and a device model does not read that knob:
 * bw-board's `slide_switch` stamps from `params.position`, the DIP switches from
 * the `params.switches` bitmask, `hall_analog` / `hall_digital` from
 * `params.field`, `reed_switch` from `params.magnet`, and `phototransistor` /
 * `photodiode` from `ambient(part, 'light')`, i.e. `params.light` before the
 * world value. So a table row saying "field +1 | 4.5 V" was either declined or
 * held against the authored field, and the builders of the lab circuits had to
 * write their claims around it.
 *
 * Those params are not private. bw-board's stimulus catalogue
 * (src/stimulus-catalogue.js) names them as the "param" mechanism — "Set via
 * board.setPartParam(partId, param, value)" — and bw-circuit-ui's
 * CircuitDesigner drives every one of them through exactly that call
 * (handleSetPartParam). The census drives them the same way the UI does, after
 * the board is built, which is also how it drives a button: the authored
 * circuit is never rewritten.
 *
 * A control key of the form `@<partId>.<param>` means "setPartParam"; any other
 * key keeps its old meaning (setControl). `light_sensor` and `ldr` read the
 * setControl knob and keep using it.
 *
 * WHAT IS READ, AND WHAT IS NOT
 * -----------------------------
 * A condition is read only where the document states it unambiguously: a table
 * cell under a header that names the input ("field slider | +1", "light | 0.8",
 * "S1 | S2 | on | off"), or prose that names it ("in full light", "field
 * −0.5", "slide switch in position b", "S1, S3 and S4 on"). A slide switch's
 * "on"/"off" is NOT read: an SPDT has two positions and neither is "on". A
 * value outside the model's range (a field of 4.5, a light of 3) is not read
 * either — it is a reading in another column, not a setting.
 */

/** Device-model inputs, by kind. `param` is the part param bw-board's model reads. */
export const PARAM_INPUTS = {
    slide_switch: { param: 'position', states: [0, 1] },
    dip_switch: { param: 'switches', positions: 4, firstIndex: 0 },
    dip_switch_spst: { param: 'switches', positions: 4, firstIndex: 1 },
    dip_switch_dpst: { param: 'switches', positions: 2, firstIndex: 1 },
    hall_analog: { param: 'field', range: [-1, 1], states: [-1, -0.5, 0, 0.5, 1] },
    hall_digital: { param: 'field', range: [0, 1], states: [0, 0.5, 1] },
    reed_switch: { param: 'magnet', states: [0, 1] },
    phototransistor: { param: 'light', range: [0, 1], states: [0, 0.5, 1] },
    photodiode: { param: 'light', range: [0, 1], states: [0, 0.5, 1] },
};

/** Light-reading parts whose level is the setControl knob rather than a param. */
const CONTROL_LIGHT = new Set(['light_sensor', 'ldr']);

const DIP = new Set(['dip_switch', 'dip_switch_spst', 'dip_switch_dpst']);
const LIGHT = new Set(['phototransistor', 'photodiode', 'light_sensor', 'ldr']);
const HALL = new Set(['hall_analog', 'hall_digital']);

export const paramKey = (id, param) => `@${id}.${param}`;

/** `@id.param` -> {id, param}, or null for an ordinary setControl key. */
export function parseParamKey (key) {
    if (!String(key).startsWith('@')) return null;
    const dot = key.lastIndexOf('.');
    if (dot < 2) return null;
    return { id: key.slice(1, dot), param: key.slice(dot + 1) };
}

/** The control key that sets a light-reading part's level. */
const lightKey = (p) => CONTROL_LIGHT.has(p.kind) ? p.id : paramKey(p.id, 'light');

const num = (s) => parseFloat(String(s).replace(/[−–]/, '-'));
const clean = (s) => String(s).replace(/[*`_]/g, '').replace(/\((?:authored|default|as built)\)/ig, '').trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** "slide_switch_6" is written "slide switch 6" as often as by its id. */
const idPattern = (id) => escapeRe(id.toLowerCase()).replace(/_/g, '[ _-]?');

/** A light level from a cell or a captured phrase: 0..1, a percentage, or a word. */
export function lightLevel (raw) {
    const s = clean(raw).toLowerCase();
    const n = s.match(/^~?(\d+(?:\.\d+)?|\.\d+)\s*(%)?(?:\s|$|[,;(])/);
    if (n) {
        const v = n[2] ? num(n[1]) / 100 : num(n[1]);
        return v >= 0 && v <= 1 ? v : null;
    }
    if (/^(full|bright|maximum|max)\b/.test(s)) return 1;
    if (/^half\b/.test(s)) return 0.5;
    if (/^(a |one )?quarter\b/.test(s)) return 0.25;
    if (/^(a |one )tenth\b/.test(s)) return 0.1;
    if (/^(dark|darkness|none|no light|covered|complete darkness|total darkness)\b/.test(s)) return 0;
    return null;
}

/** A field strength from a cell: a unitless signed number, or "none". */
function fieldLevel (raw, [lo, hi]) {
    const s = clean(raw).toLowerCase();
    const n = s.match(/^~?([-+−–]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*$|\s*[,;(]|\s+(?:north|south|either|weak|strong))/);
    if (n) {
        const v = num(n[1]);
        return v >= lo && v <= hi ? v : null;
    }
    if (/^(none|no field|no magnet|zero)\b/.test(s)) return 0;
    return null;
}

/** "a" / "b" / "position b" / "B (authored)" -> 0 / 1. */
function slidePosition (raw) {
    const m = clean(raw).match(/^(?:position\s+|pos\.?\s*|side\s+)?\(?([ab])\)?(?=\s*$|\s*[,;(—–-])/i);
    return m ? (m[1].toLowerCase() === 'a' ? 0 : 1) : null;
}

/** A switch cell: on / off / closed / open / 1 / 0. */
function switchState (raw) {
    const s = clean(raw).toLowerCase();
    if (/^(on|closed|1|yes|up)\b/.test(s)) return 1;
    if (/^(off|open|0|no|down)\b/.test(s)) return 0;
    return null;
}

/** Split a router table context ("head = cell | head = cell") back into pairs. */
export function pairsOf (tctx) {
    if (!tctx) return [];
    return String(tctx).split(' | ').map(bit => {
        const i = bit.indexOf(' = ');
        return i < 0 ? null : { head: bit.slice(0, i).trim(), cell: bit.slice(i + 3).trim() };
    }).filter(Boolean);
}

/**
 * Read the device-model inputs a claim states.
 *
 * @param {{pairs: Array<{head: string, cell: string}>, prose: string}} ctx
 *        `pairs` are the table row's OTHER cells under their headers; `prose`
 *        is the sentence context (never the table row itself, whose cells are
 *        already in `pairs`).
 * @param {Array} parts the bench's parts
 * @param {object} [already] controls already read by the router, which win
 * @returns {{controls: object, labels: string[], dipRow: boolean}}
 */
export function readInputs ({ pairs = [], prose = '' }, parts, already = {}) {
    const controls = {};
    const labels = [];
    const of = (set) => (parts || []).filter(p => set.has(p.kind));
    const set = (key, v, label) => {
        if (already[key] !== undefined || controls[key] !== undefined) return;
        controls[key] = v; labels.push(label);
    };

    // ---- light -----------------------------------------------------------
    const lights = of(LIGHT);
    if (lights.length) {
        let level = null;
        for (const { head, cell } of pairs) {
            if (!/\b(light|illumination|brightness|lux)\b/i.test(head) || /switch|led|lamp|bulb/i.test(head)) continue;
            level = lightLevel(cell);
            if (level !== null) break;
        }
        if (level === null) {
            const n = prose.match(/\blight(?:\s+level)?\s*(?:=|:|of|at)?\s*~?(\d+(?:\.\d+)?|\.\d+)\s*(%)?(?![\d.])(?!\s*(?:V|mV|mA|µA|uA|nA|A|Ω|kΩ|s|ms|Hz|lx)\b)/i);
            if (n) level = lightLevel(`${n[1]}${n[2] || ''}`);
        }
        if (level === null) {
            const w = prose.match(/\b(full|bright|half|quarter)\s+light\b/i);
            if (w) level = lightLevel(w[1]);
            else if (/\bin\s+(?:the\s+|complete\s+|total\s+)?dark(?:ness)?\b|\b(?:complete|total)\s+darkness\b/i.test(prose)) level = 0;
        }
        if (level !== null)
            for (const p of lights) set(lightKey(p), level, `${p.id} light ${level}`);
    }

    // ---- magnetic field (Hall) ------------------------------------------
    for (const p of of(HALL)) {
        const range = PARAM_INPUTS[p.kind].range;
        let f = null;
        for (const { head, cell } of pairs) {
            if (!/\b(field|magnet|hall)\b/i.test(head) || /\boutput\b|\bvoltage\b/i.test(head)) continue;
            f = fieldLevel(cell, range);
            if (f !== null) break;
        }
        if (f === null) {
            const n = prose.match(/\bfield(?:\s+slider)?\s*(?:=|:|of|at)?\s*~?([-+−–]?(?:\d+(?:\.\d+)?|\.\d+))(?![\d.])(?!\s*(?:m?T|G|%|V|mV|mA|°|cm|mm)\b)/i);
            if (n && num(n[1]) >= range[0] && num(n[1]) <= range[1]) f = num(n[1]);
            else if (/\bno (?:magnetic )?field\b|\bno magnet\b/i.test(prose)) f = 0;
        }
        if (f !== null) set(paramKey(p.id, 'field'), f, `${p.id} field ${f}`);
    }

    // ---- reed switch's magnet -------------------------------------------
    for (const p of of(new Set(['reed_switch']))) {
        let m = null;
        for (const { head, cell } of pairs) {
            if (!/\b(magnet|reed)\b/i.test(head)) continue;
            const s = clean(cell).toLowerCase();
            if (/^(present|near|close|yes|on|closed|held|applied|1)\b/.test(s)) m = 1;
            else if (/^(absent|away|removed|gone|no|none|off|open|0)\b/.test(s)) m = 0;
            if (m !== null) break;
        }
        if (m === null) {
            if (/\bmagnet\s+(?:is\s+)?(?:near|present|close|held|applied|in place)\b/i.test(prose)) m = 1;
            else if (/\bmagnet\s+(?:is\s+)?(?:away|removed|absent|gone)\b|\bno magnet\b/i.test(prose)) m = 0;
        }
        if (m !== null) set(paramKey(p.id, 'magnet'), m, `${p.id} magnet ${m ? 'present' : 'absent'}`);
    }

    // ---- slide switches --------------------------------------------------
    const slides = (parts || []).filter(p => p.kind === 'slide_switch');
    for (const { head, cell } of pairs) {
        const pos = slidePosition(cell);
        if (pos === null) continue;
        const named = slides.find(p => new RegExp(`\\b${idPattern(p.id)}\\b`, 'i').test(head));
        const target = named || (slides.length === 1 && /\b(slide|switch|position|selector|select|range|gain|mode)\b/i.test(head) ? slides[0] : null);
        if (target) set(paramKey(target.id, 'position'), pos, `${target.id} position ${'ab'[pos]}`);
    }
    // "b" after "position" can only be the position; "a" can be the article
    // ("in position a resistor would ..."), so "a" must END the phrase.
    for (const m of prose.matchAll(/\b(?:position|side)\s*[=:]?\s*\(?\s*(?:(b)\b(?![\w'’-])|(a)(?=\s*(?:$|[,.;:)(—–])))/gi)) {
        m[1] = m[1] || m[2];
        const before = prose.slice(Math.max(0, m.index - 48), m.index);
        const named = slides.find(p => new RegExp(`\\b${idPattern(p.id)}\\b`, 'i').test(before));
        const target = named || (slides.length === 1 ? slides[0] : null);
        if (target) set(paramKey(target.id, 'position'), m[1].toLowerCase() === 'a' ? 0 : 1, `${target.id} position ${m[1].toLowerCase()}`);
    }

    // ---- DIP switches ----------------------------------------------------
    // Only a bench with ONE DIP block is read from bare "S1".."S4": with two,
    // "S1" does not say which block, and guessing is how a row gets solved at
    // the wrong pattern.
    let dipRow = false;
    const dips = of(DIP);
    for (const p of dips) {
        const spec = PARAM_INPUTS[p.kind];
        const label = new RegExp(`^(?:${idPattern(p.id)}[ _.-]?${dips.length === 1 ? '|s|sw|switch\\s*|dip\\s*' : ''})(\\d)$`, 'i');
        const bits = new Map();
        for (const { head, cell } of pairs) {
            const h = clean(head).match(label);
            if (!h) continue;
            const st = switchState(cell);
            if (st !== null) bits.set(parseInt(h[1], 10), st);
        }
        const fromRow = bits.size > 0;
        if (!fromRow && dips.length === 1) {
            for (const m of prose.matchAll(/\b((?:S|SW)\s?\d(?:\s*(?:,|and|\+|&)\s*(?:S|SW)\s?\d)*)\s+(?:is\s+|are\s+)?(on|off|closed|open)\b/gi)) {
                const st = /on|closed/i.test(m[2]) ? 1 : 0;
                for (const d of m[1].matchAll(/\d/g)) bits.set(parseInt(d[0], 10), st);
            }
        }
        if (!bits.size) continue;
        // A 0-indexed block (s0..s3) written 1-indexed is the common case;
        // only a stated S0 means the document counts from zero.
        const first = p.kind === 'dip_switch' && !bits.has(0) ? 1 : spec.firstIndex;
        let mask = Number(p.params?.switches ?? 0) | 0;
        let ok = true;
        for (const [n, st] of bits) {
            const bit = n - first;
            if (bit < 0 || bit >= spec.positions) { ok = false; break; }
            mask = st ? (mask | (1 << bit)) : (mask & ~(1 << bit));
        }
        if (!ok) continue;
        const pattern = Array.from({ length: spec.positions }, (_, i) => (mask >> i) & 1).join('');
        set(paramKey(p.id, 'switches'), mask, `${p.id} switches ${pattern}`);
        if (fromRow && bits.size >= 2) dipRow = true;
    }
    return { controls, labels, dipRow };
}

/**
 * The extra states a bench can be put in through these inputs, for a claim
 * that names no condition. Appended AFTER the router's own states, so a claim
 * that already matched one keeps matching the same one.
 */
export function inputStates (parts) {
    const out = [];
    const slides = (parts || []).filter(p => p.kind === 'slide_switch');
    // Two slide switches are four states, and a 2-bit DAC needs all four; past
    // three switches the product is too many solves for what it buys, so each
    // is flipped alone.
    if (slides.length && slides.length <= 3) {
        let combos = [{}];
        for (const p of slides)
            combos = combos.flatMap(c => [0, 1].map(v => ({ ...c, [paramKey(p.id, 'position')]: v })));
        for (const c of combos)
            out.push({ controls: c, label: slides.map(p => `${p.id} ${'ab'[c[paramKey(p.id, 'position')]]}`).join(', ') });
    } else {
        for (const p of slides) for (const v of [0, 1])
            out.push({ controls: { [paramKey(p.id, 'position')]: v }, label: `${p.id} position ${'ab'[v]}` });
    }
    for (const p of parts || []) {
        const spec = PARAM_INPUTS[p.kind];
        if (DIP.has(p.kind)) {
            const all = (1 << spec.positions) - 1;
            const masks = [0, all, ...Array.from({ length: spec.positions }, (_, i) => 1 << i)];
            for (const m of masks)
                out.push({ controls: { [paramKey(p.id, 'switches')]: m }, label: `${p.id} switches ${m.toString(2).padStart(spec.positions, '0').split('').reverse().join('')}` });
        } else if (spec && p.kind !== 'slide_switch') {
            for (const v of spec.states)
                out.push({ controls: { [paramKey(p.id, spec.param)]: v }, label: `${p.id} ${spec.param} ${v}` });
        } else if (p.kind === 'light_sensor') {
            for (const v of [0, 0.5, 1]) out.push({ controls: { [p.id]: v }, label: `${p.id} light ${v}` });
        }
    }
    return out;
}

/**
 * Drive one `@id.param` control on a built board — the same call the UI makes
 * (bw-circuit-ui CircuitDesigner.handleSetPartParam -> board.setPartParam).
 */
export function applyParam (board, key, value) {
    const k = parseParamKey(key);
    if (!k || typeof board.setPartParam !== 'function') return false;
    board.setPartParam(k.id, k.param, value);
    return true;
}
