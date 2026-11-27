// Game export model ("bwgame-model-v1").
//
// Input: the current SB3 graph (project.json) plus its asset files. This is the
// validated semantic model the export plan asks for (docs in GAME-EXPORT.md): we do
// not re-parse pretty-printed code, we walk the edited block graph directly and
// produce
//   - a runtime manifest (stage/sprites/costumes/sounds/variables/monitors),
//   - per-target normalized scripts and procedures (a small tree IR), and
//   - a capability report: every opcode used is exact, approximate or unsupported
//     for the bwgame-v1 runtime. Unsupported opcodes block export.

export const MODEL_VERSION = 'bwgame-model-v1';

// ------------------------------------------------------------------ capabilities

// exact: same observable semantics as scratch-vm for the admitted inputs.
// approx: runs, with a documented difference (note).
const EXACT = new Set(`
event_whenflagclicked event_whenkeypressed event_whenbroadcastreceived event_broadcast event_broadcastandwait
event_whenbackdropswitchesto
control_wait control_repeat control_forever control_if control_if_else control_wait_until control_repeat_until
control_stop control_create_clone_of control_delete_this_clone control_start_as_clone
motion_movesteps motion_turnright motion_turnleft motion_gotoxy motion_goto motion_glidesecstoxy motion_glideto
motion_changexby motion_setx motion_changeyby motion_sety motion_pointindirection motion_setrotationstyle
motion_xposition motion_yposition motion_direction
looks_switchcostumeto looks_nextcostume looks_switchbackdropto looks_nextbackdrop looks_switchbackdroptoandwait
looks_show looks_hide looks_changesizeby looks_setsizeto looks_size looks_costumenumbername looks_backdropnumbername
looks_gotofrontback looks_goforwardbackwardlayers looks_cleargraphiceffects
sound_setvolumeto sound_changevolumeby sound_volume
sensing_keypressed sensing_mousedown sensing_mousex sensing_mousey sensing_timer sensing_resettimer sensing_answer
sensing_askandwait sensing_of sensing_current sensing_dayssince2000 sensing_username
operator_add operator_subtract operator_multiply operator_divide operator_random operator_gt operator_lt
operator_equals operator_and operator_or operator_not operator_join operator_letter_of operator_length
operator_contains operator_mod operator_round operator_mathop
data_variable data_setvariableto data_changevariableby data_showvariable data_hidevariable
data_listcontents data_addtolist data_deleteoflist data_deletealloflist data_insertatlist data_replaceitemoflist
data_itemoflist data_itemnumoflist data_lengthoflist data_listcontainsitem
procedures_definition procedures_call procedures_prototype argument_reporter_string_number argument_reporter_boolean
`.trim().split(/\s+/));

const APPROX = {
    sensing_touchingobject: 'Collision uses the rotated box around what each costume draws, not exact pixels.',
    sensing_distanceto: 'Exact for sprite centres; matches Scratch.',
    motion_ifonedgebounce: 'Edge detection uses the rotated bounding box, not costume pixels.',
    motion_pointtowards: 'Exact for sprite centres.',
    event_whenthisspriteclicked: 'Hit testing uses the rotated bounding box, not costume pixels.',
    event_whenstageclicked: 'Fires when no sprite bounding box is under the pointer.',
    looks_say: 'Speech bubble styling differs from Scratch.',
    looks_sayforsecs: 'Speech bubble styling differs from Scratch.',
    looks_think: 'Thought bubble styling differs from Scratch.',
    looks_thinkforsecs: 'Thought bubble styling differs from Scratch.',
    looks_seteffectto: 'Only ghost and brightness are rendered; other effects are tracked but not drawn.',
    looks_changeeffectby: 'Only ghost and brightness are rendered; other effects are tracked but not drawn.',
    sound_play: 'Playback depends on the host audio device; timing is not sample-accurate.',
    sound_playuntildone: 'Waits for the sound\'s recorded duration.',
    sound_stopallsounds: 'Stops host playback.',
    sound_seteffectto: 'Pitch/pan effects are ignored.',
    sound_changeeffectby: 'Pitch/pan effects are ignored.',
    sound_cleareffects: 'Pitch/pan effects are ignored.',
    data_showlist: 'List monitors are not drawn.',
    data_hidelist: 'List monitors are not drawn.',
    sensing_setdragmode: 'Dragging sprites is not implemented; the flag is ignored.',
    pen_clear: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    pen_stamp: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    pen_penDown: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    pen_penUp: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    pen_setPenColorToColor: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    pen_changePenColorParamBy: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    pen_setPenColorParamTo: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    pen_changePenSizeBy: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    pen_setPenSizeTo: 'Pen rendering uses the host 2D canvas/pygame surface; anti-aliasing differs.',
    control_forever: null, // placeholder never used (exact)
    __scheduler: 'Compute-only loops run one iteration per frame; Scratch may run several within its frame budget.'
};
delete APPROX.control_forever;

// Menus (shadow blocks) are resolved into literals; they are never statements.
const MENU_OPS = new Set(`
motion_goto_menu motion_glideto_menu motion_pointtowards_menu looks_costume looks_backdrops sound_sounds_menu
control_create_clone_of_menu sensing_touchingobjectmenu sensing_distancetomenu sensing_keyoptions
sensing_of_object_menu pen_menu_colorParam
`.trim().split(/\s+/));

export function classify (opcode) {
    if (EXACT.has(opcode)) return { level: 'exact' };
    if (Object.prototype.hasOwnProperty.call(APPROX, opcode)) return { level: 'approximate', note: APPROX[opcode] };
    if (MENU_OPS.has(opcode)) return { level: 'exact' };
    return { level: 'unsupported' };
}

// ------------------------------------------------------------------ assets

function u8 (data) {
    if (data instanceof Uint8Array) return data;
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (data && data.buffer) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new Uint8Array(0);
}

function svgSize (bytes) {
    const text = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 4096)));
    const tag = /<svg\b[^>]*>/i.exec(text);
    if (!tag) return null;
    const attr = (n) => { const m = new RegExp(`\\b${n}\\s*=\\s*["']([^"']+)["']`, 'i').exec(tag[0]); return m ? m[1] : null; };
    let w = parseFloat(attr('width')), h = parseFloat(attr('height'));
    const vb = attr('viewBox');
    if ((!(w > 0) || !(h > 0)) && vb) {
        const p = vb.split(/[\s,]+/).map(Number);
        if (p.length === 4) { w = p[2]; h = p[3]; }
    }
    return (w > 0 && h > 0) ? { width: w, height: h } : null;
}

function pngSize (b) {
    if (b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50) return null;
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { width: dv.getUint32(16), height: dv.getUint32(20) };
}

function jpgSize (b) {
    if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
    let i = 2;
    while (i + 9 < b.length) {
        if (b[i] !== 0xFF) { i++; continue; }
        const m = b[i + 1];
        const len = (b[i + 2] << 8) | b[i + 3];
        if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
            return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
        }
        i += 2 + len;
    }
    return null;
}

// Tight bounds of what an SVG actually draws, from its basic shapes (rect,
// circle, ellipse, line, polygon/polyline, and paths with absolute coordinates),
// widened by half the stroke. Returns null (use the full canvas) whenever the
// geometry is not simple enough to bound exactly: transforms, relative or curved
// path commands, <use>, <image>, <text>.
export function svgContentBounds (data) {
    const text = new TextDecoder().decode(u8(data));
    if (/\btransform\s*=|<use\b|<image\b|<text\b|<g\b[^>]*\bstyle=/i.test(text)) return null;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    const grow = (x0, y0, x1, y1, sw) => {
        l = Math.min(l, x0 - sw); t = Math.min(t, y0 - sw); r = Math.max(r, x1 + sw); b = Math.max(b, y1 + sw);
    };
    const re = /<(rect|circle|ellipse|line|polygon|polyline|path)\b([^>]*)>/gi;
    let m, seen = 0;
    while ((m = re.exec(text))) {
        const tag = m[1].toLowerCase(), attrs = m[2];
        const a = (n, d = 0) => { const x = new RegExp(`(?:^|\\s)${n}\\s*=\\s*["']([^"']*)["']`, 'i').exec(attrs); return x ? x[1] : d; };
        const f = (n) => parseFloat(a(n, '0')) || 0;
        const stroke = a('stroke', 'none');
        const sw = stroke && stroke !== 'none' ? (parseFloat(a('stroke-width', '1')) || 0) / 2 : 0;
        seen++;
        if (tag === 'rect') grow(f('x'), f('y'), f('x') + f('width'), f('y') + f('height'), sw);
        else if (tag === 'circle') grow(f('cx') - f('r'), f('cy') - f('r'), f('cx') + f('r'), f('cy') + f('r'), sw);
        else if (tag === 'ellipse') grow(f('cx') - f('rx'), f('cy') - f('ry'), f('cx') + f('rx'), f('cy') + f('ry'), sw);
        else if (tag === 'line') grow(Math.min(f('x1'), f('x2')), Math.min(f('y1'), f('y2')), Math.max(f('x1'), f('x2')), Math.max(f('y1'), f('y2')), sw);
        else {
            let pts;
            if (tag === 'path') {
                const d = a('d', '');
                if (/[a-z]/.test(d.replace(/e[-+]?\d/gi, '')) || /[CSQTA]/.test(d)) return null;
                pts = d.replace(/[MLHVZ]/g, ' ').trim();
                if (/[HV]/.test(d)) return null;
            } else pts = a('points', '');
            const nums = pts.split(/[\s,]+/).filter(Boolean).map(Number);
            if (nums.length < 2 || nums.some(Number.isNaN)) return null;
            for (let i = 0; i + 1 < nums.length; i += 2) grow(nums[i], nums[i + 1], nums[i], nums[i + 1], sw);
        }
    }
    if (!seen || !Number.isFinite(l)) return null;
    return [l, t, r, b];
}

export function assetSize (format, data) {
    const b = u8(data);
    if (format === 'svg') return svgSize(b);
    if (format === 'png') return pngSize(b);
    if (format === 'jpg' || format === 'jpeg') return jpgSize(b);
    return null;
}

// ------------------------------------------------------------------ graph walk

function lit (v) { return { k: 'lit', v }; }

// SB3 literal inputs keep numbers as strings; a canonical numeric string becomes a
// number so generated code reads naturally. The runtime casts either way.
function literalOf (prim) {
    const [type, value] = prim;
    if (type >= 4 && type <= 8) {
        const s = String(value);
        if (s.trim() !== '' && String(Number(s)) === s) return lit(Number(s));
        return lit(s);
    }
    if (type === 9) return lit(String(value));     // colour
    if (type === 10) {
        const s = String(value);
        return lit(s);
    }
    return null;
}

export class GameModelBuilder {
    constructor (project, files = {}) {
        this.project = project;
        this.files = files;
        this.report = { model: MODEL_VERSION, exact: {}, approximate: {}, unsupported: [], ignored: [], notes: [] };
    }

    build () {
        const targets = this.project.targets || [];
        const stageT = targets.find(t => t.isStage);
        if (!stageT) throw new Error('project has no stage');
        this.stageT = stageT;
        this.byName = new Map(targets.map(t => [t.name, t]));
        this.varScope = new Map();
        for (const t of targets) {
            for (const [id, v] of Object.entries(t.variables || {})) this.varScope.set(`${t.name}\u0000${id}`, { scope: t.isStage ? 'global' : 'local', name: v[0] });
            for (const [id, v] of Object.entries(t.lists || {})) this.varScope.set(`${t.name}\u0000L${id}`, { scope: t.isStage ? 'global' : 'local', name: v[0] });
        }
        const manifest = {
            contract: 'bwgame-v1',
            model: MODEL_VERSION,
            stage: this._targetManifest(stageT),
            sprites: targets.filter(t => !t.isStage).map(t => this._targetManifest(t)),
            monitors: this._monitors()
        };
        manifest.stage.name = stageT.name;
        const code = targets.map(t => this._targetCode(t));
        this.report.notes.push(APPROX.__scheduler);
        return { manifest, code, report: this.report };
    }

    _asset (md5ext) {
        const f = this.files[md5ext];
        return f === undefined ? null : f;
    }

    _targetManifest (t) {
        const costumes = (t.costumes || []).map(c => {
            const fmt = (c.dataFormat || '').toLowerCase();
            const res = c.bitmapResolution || (fmt === 'svg' ? 1 : 2);
            const data = this._asset(c.md5ext || `${c.assetId}.${fmt}`);
            if (data === null) this.report.unsupported.push({ target: t.name, opcode: 'asset', detail: `missing costume asset ${c.md5ext}` });
            const size = data !== null ? assetSize(fmt, data) : null;
            if (data !== null && !size) this.report.notes.push(`${t.name}/${c.name}: could not read ${fmt} size; using 1×1 bounds`);
            const w = (size ? size.width : 1), h = (size ? size.height : 1);
            let box = (fmt === 'svg' && data !== null) ? svgContentBounds(data) : null;
            // clip to the canvas; fall back to the full canvas
            box = box ? [Math.max(0, box[0]), Math.max(0, box[1]), Math.min(w, box[2]), Math.min(h, box[3])] : [0, 0, w, h];
            if (!(box[2] > box[0] && box[3] > box[1])) box = [0, 0, w, h];
            return {
                name: c.name, file: `assets/${c.md5ext || `${c.assetId}.${fmt}`}`, format: fmt, resolution: res,
                width: w / res, height: h / res,
                cx: (c.rotationCenterX || 0) / res, cy: (c.rotationCenterY || 0) / res,
                // what the costume draws (left, top, right, bottom), used for touching/edges/fencing
                bounds: box.map(v => v / res)
            };
        });
        const sounds = (t.sounds || []).map(s => {
            const data = this._asset(s.md5ext || `${s.assetId}.${s.dataFormat}`);
            if (data === null) this.report.unsupported.push({ target: t.name, opcode: 'asset', detail: `missing sound asset ${s.md5ext}` });
            return {
                name: s.name, file: `assets/${s.md5ext || `${s.assetId}.${s.dataFormat}`}`, format: s.dataFormat,
                duration: (s.rate > 0 && s.sampleCount > 0) ? s.sampleCount / s.rate : 0
            };
        });
        const m = {
            name: t.name,
            variables: Object.fromEntries(Object.values(t.variables || {}).map(v => [v[0], v[1]])),
            lists: Object.fromEntries(Object.values(t.lists || {}).map(l => [l[0], [...(l[1] || [])]])),
            costumes, sounds,
            currentCostume: t.currentCostume || 0,
            volume: t.volume ?? 100
        };
        if (!t.isStage) {
            Object.assign(m, {
                x: t.x || 0, y: t.y || 0, direction: t.direction ?? 90, size: t.size ?? 100,
                visible: t.visible !== false, rotationStyle: t.rotationStyle || 'all around',
                layerOrder: t.layerOrder || 0, draggable: !!t.draggable
            });
        }
        return m;
    }

    _monitors () {
        const out = [];
        for (const mon of this.project.monitors || []) {
            if (mon.opcode !== 'data_variable' && mon.opcode !== 'data_listcontents') continue;
            const owner = mon.spriteName ? mon.spriteName : this.stageT.name;
            const name = mon.params && (mon.params.VARIABLE || mon.params.LIST);
            out.push({
                id: mon.id, kind: mon.opcode === 'data_variable' ? 'var' : 'list',
                target: mon.spriteName ? owner : '_stage_', name,
                label: mon.spriteName ? `${owner}: ${name}` : name,
                visible: !!mon.visible, mode: mon.mode || 'default',
                x: mon.x || 0, y: mon.y || 0
            });
        }
        return out;
    }

    _count (opcode, target, blockId) {
        const c = classify(opcode);
        if (c.level === 'exact') this.report.exact[opcode] = (this.report.exact[opcode] || 0) + 1;
        else if (c.level === 'approximate') {
            const e = this.report.approximate[opcode] || (this.report.approximate[opcode] = { count: 0, note: c.note });
            e.count++;
        } else this.report.unsupported.push({ target, opcode, block: blockId });
        return c.level;
    }

    _targetCode (t) {
        this.t = t;
        this.blocks = t.blocks || {};
        const scripts = [];
        const procs = [];
        for (const [id, b] of Object.entries(this.blocks)) {
            if (!b || Array.isArray(b) || !b.topLevel) continue;
            const hat = this._hat(id, b);
            if (hat === null) {
                this.report.ignored.push({ target: t.name, block: id, opcode: b.opcode, why: 'loose stack without a hat never runs' });
                continue;
            }
            if (hat.kind === 'proc') { procs.push(hat.proc); continue; }
            scripts.push({ hat, body: this._stack(b.next) });
        }
        return { name: t.name, isStage: !!t.isStage, scripts, procs };
    }

    _field (b, name) { const f = b.fields && b.fields[name]; return f ? f[0] : undefined; }

    _hat (id, b) {
        const op = b.opcode;
        const simple = {
            event_whenflagclicked: 'flag', event_whenthisspriteclicked: 'clicked', event_whenstageclicked: 'clicked',
            control_start_as_clone: 'clone'
        };
        if (simple[op]) { this._count(op, this.t.name, id); return { kind: simple[op], arg: null }; }
        if (op === 'event_whenkeypressed') { this._count(op, this.t.name, id); return { kind: 'key', arg: this._field(b, 'KEY_OPTION') }; }
        if (op === 'event_whenbroadcastreceived') { this._count(op, this.t.name, id); return { kind: 'broadcast', arg: this._field(b, 'BROADCAST_OPTION') }; }
        if (op === 'event_whenbackdropswitchesto') { this._count(op, this.t.name, id); return { kind: 'backdrop', arg: this._field(b, 'BACKDROP') }; }
        if (op === 'procedures_definition') {
            this._count(op, this.t.name, id);
            const protoId = b.inputs.custom_block && b.inputs.custom_block[1];
            const proto = this.blocks[protoId];
            const m = proto.mutation || {};
            return {
                kind: 'proc',
                proc: {
                    proccode: m.proccode, warp: String(m.warp) === 'true',
                    params: JSON.parse(m.argumentnames || '[]'),
                    body: this._stack(b.next)
                }
            };
        }
        // Any other hat (extension hats, timer/loudness) is unsupported; a non-hat
        // top-level stack is ignored, as Scratch never runs it.
        if (/^event_when|_when/.test(op) || op.endsWith('_hat')) {
            this._count(op, this.t.name, id);
            return { kind: 'unsupported', arg: op };
        }
        return null;
    }

    _stack (id) {
        const out = [];
        while (id) {
            const b = this.blocks[id];
            if (!b) break;
            out.push(this._stmt(id, b));
            id = b.next;
        }
        return out;
    }

    _stmt (id, b) {
        this._count(b.opcode, this.t.name, id);
        const node = { op: b.opcode, id, args: {}, fields: {} };
        for (const [k, v] of Object.entries(b.fields || {})) node.fields[k] = v[0];
        for (const [k, inp] of Object.entries(b.inputs || {})) {
            if (k === 'SUBSTACK' || k === 'SUBSTACK2') { node[k === 'SUBSTACK' ? 'sub' : 'sub2'] = this._stack(inp[1]); continue; }
            node.args[k] = this._input(inp);
        }
        if (b.opcode === 'procedures_call') {
            node.proccode = b.mutation.proccode;
            node.argIds = JSON.parse(b.mutation.argumentids || '[]');
        }
        this._resolveData(node, b);
        return node;
    }

    _resolveData (node, b) {
        if (b.fields && b.fields.VARIABLE) node.variable = this._var(b.fields.VARIABLE, false);
        if (b.fields && b.fields.LIST) node.list = this._var(b.fields.LIST, true);
    }

    _var (field, isList) {
        const [name, id] = field;
        const key = isList ? `L${id}` : id;
        const own = this.varScope.get(`${this.t.name}\u0000${key}`);
        if (own) return { ...own, id };
        const glob = this.varScope.get(`${this.stageT.name}\u0000${key}`);
        if (glob) return { ...glob, id };
        // Fall back to name lookup: local first, then global.
        const local = Object.values((isList ? this.t.lists : this.t.variables) || {}).some(v => v[0] === name);
        return { scope: local && !this.t.isStage ? 'local' : 'global', name, id };
    }

    _input (inp) {
        if (!Array.isArray(inp)) return lit('');
        const v = inp[1];
        if (v === null || v === undefined) return inp.length > 2 ? this._input([1, inp[2]]) : lit('');
        if (Array.isArray(v)) {
            if (v[0] === 12) return { k: 'var', ...this._var([v[1], v[2]], false) };
            if (v[0] === 13) return { k: 'listcontents', ...this._var([v[1], v[2]], true) };
            if (v[0] === 11) return lit(v[1]);
            return literalOf(v) || lit('');
        }
        const b = this.blocks[v];
        if (!b) return lit('');
        if (MENU_OPS.has(b.opcode)) {
            const f = Object.values(b.fields || {})[0];
            return lit(f ? f[0] : '');
        }
        if (b.opcode === 'data_variable') { this._count(b.opcode, this.t.name, v); return { k: 'var', ...this._var(b.fields.VARIABLE, false) }; }
        if (b.opcode === 'data_listcontents') { this._count(b.opcode, this.t.name, v); return { k: 'listcontents', ...this._var(b.fields.LIST, true) }; }
        if (b.opcode === 'argument_reporter_string_number' || b.opcode === 'argument_reporter_boolean') {
            this._count(b.opcode, this.t.name, v);
            return { k: 'param', name: b.fields.VALUE[0], boolean: b.opcode === 'argument_reporter_boolean' };
        }
        const node = this._stmt(v, b);
        node.k = 'op';
        return node;
    }
}

export function buildGameModel (project, files) {
    return new GameModelBuilder(project, files).build();
}
