// Game export emitters: one lowering, two syntax profiles (JavaScript, Python).
//
// Both backends walk the same normalized model (model.js) and call the same
// bwgame-v1 runtime API, so the semantic mapping of every opcode lives in one
// place. Scripts become generators: JS `function*` / `yield*`, Python `def` /
// `yield from`. Loops yield once per iteration; waits yield until their time.

const RESERVED = new Set(`
break case catch class const continue debugger default delete do else export extends finally for function if
import in instanceof new return super switch this throw try typeof var void while with yield let static
enum await implements package protected interface private public null true false undefined NaN Infinity
and as assert async def del elif except from global is lambda nonlocal not or pass raise None True False
self stage game print len str int float list dict range type object id input
`.trim().split(/\s+/));

export function ident (name, used) {
    let s = String(name).normalize('NFKD').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
    if (!s) s = 'x';
    if (/^\d/.test(s)) s = `_${s}`;
    if (RESERVED.has(s)) s += '_';
    if (used) {
        let k = s, n = 2;
        while (used.has(k)) k = `${s}_${n++}`;
        used.add(k);
        s = k;
    }
    return s;
}

const camelToSnake = s => (/^[A-Z_]+$/.test(s) ? s : s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`));

export const JS = {
    name: 'js',
    ext: 'js',
    comment: '//',
    str: s => JSON.stringify(String(s)),
    num: n => (Number.isFinite(n) ? String(n) : (Number.isNaN(n) ? 'NaN' : (n > 0 ? 'Infinity' : '-Infinity'))),
    TRUE: 'true', FALSE: 'false', NULL: 'null',
    and: (a, b) => `(${a} && ${b})`,
    or: (a, b) => `(${a} || ${b})`,
    not: a => `!${a}`,
    m: n => n,
    h: n => n,
    stmt: s => `${s};`,
    yield: 'yield;',
    yieldFrom: e => `yield* ${e};`,
    lambda: e => `() => ${e}`,
    ret: 'return;',
    ifOpen: c => `if (${c}) {`,
    elseOpen: '} else {',
    close: '}',
    whileOpen: c => `while (${c}) {`,
    foreverOpen: 'for (;;) {',
    repeatOpen: (v, n) => `for (let ${v} = times(${n}); ${v} >= 1; ${v}--) {`,
    defOpen: (fn, params) => `function* ${fn} (${params.join(', ')}) {`,
    defClose: () => ['}'],
    vars: (obj, name) => `${obj}.vars[${JSON.stringify(name)}]`,
    lists: (obj, name) => `${obj}.lists[${JSON.stringify(name)}]`,
    assign: (lhs, rhs) => `${lhs} = ${rhs};`,
    pass: null
};

export const PY = {
    name: 'py',
    ext: 'py',
    comment: '#',
    str: s => JSON.stringify(String(s)),
    num: n => (Number.isFinite(n) ? (Number.isInteger(n) ? String(n) : String(n)) : (Number.isNaN(n) ? 'float("nan")' : (n > 0 ? 'float("inf")' : '-float("inf")'))),
    TRUE: 'True', FALSE: 'False', NULL: 'None',
    and: (a, b) => `(${a} and ${b})`,
    or: (a, b) => `(${a} or ${b})`,
    not: a => `(not ${a})`,
    m: n => camelToSnake(n),
    h: n => ({ str: 'str_', bool: 'bool_', round: 'round_', random: 'random_', letterOf: 'letter_of', attributeOf: 'attribute_of', daysSince2000: 'days_since_2000' }[n] || camelToSnake(n)),
    stmt: s => s,
    yield: 'yield',
    yieldFrom: e => `yield from ${e}`,
    lambda: e => `lambda: ${e}`,
    ret: 'return',
    ifOpen: c => `if ${c}:`,
    elseOpen: 'else:',
    close: null,
    whileOpen: c => `while ${c}:`,
    foreverOpen: 'while True:',
    repeatOpen: (v, n) => `for ${v} in times(${n}):`,
    defOpen: (fn, params) => `def ${fn}(${params.join(', ')}):`,
    defClose: () => [],
    vars: (obj, name) => `${obj}.vars[${JSON.stringify(name)}]`,
    lists: (obj, name) => `${obj}.lists[${JSON.stringify(name)}]`,
    assign: (lhs, rhs) => `${lhs} = ${rhs}`,
    pass: 'pass'
};

const IND = '    ';

const PROMISE_OPS = new Set(['looks_sayforsecs', 'looks_thinkforsecs', 'sensing_askandwait', 'sound_playuntildone']);

// Mark the statements that can be the last one run in a loop iteration and are
// promise blocks in scratch-vm. Returns the flag name if any were marked.
function markTrailingPromise (stmts, flag) {
    const last = stmts[stmts.length - 1];
    if (!last) return null;
    if (PROMISE_OPS.has(last.op)) { last.trailingPromise = flag; return flag; }
    if (last.op === 'control_if' || last.op === 'control_if_else') {
        const a = markTrailingPromise(last.sub || [], flag);
        const b = last.op === 'control_if_else' ? markTrailingPromise(last.sub2 || [], flag) : null;
        return a || b;
    }
    return null;
}

class Emitter {
    constructor (L, model) {
        this.L = L;
        this.model = model;
        this.used = new Set(['setup', 'times', 'WAIT', 'lists', 'num', 'eq', 'lt', 'gt', 'add', 'sub', 'mul', 'div', 'mod', 'join', 'length', 'contains', 'mathop', 'current']);
        this.loop = 0;
    }

    // ------------------------------------------------------------ expressions
    // Each returns { c: code, t: 'bool'|'num'|'str'|'any' }.

    m (name) { return this.L.m(name); }
    h (name) { return this.L.h(name); }
    call (fn, ...args) { return `${fn}(${args.join(', ')})`; }

    lit (v) {
        if (typeof v === 'number') return { c: this.L.num(v), t: 'num' };
        if (typeof v === 'boolean') return { c: v ? this.L.TRUE : this.L.FALSE, t: 'bool' };
        return { c: this.L.str(v), t: 'str' };
    }

    owner (v) { return v.scope === 'local' && !this.cur.isStage ? 'self' : 'stage'; }

    e (node) {
        if (!node) return { c: this.L.str(''), t: 'str' };
        switch (node.k) {
        case 'lit': return this.lit(node.v);
        case 'var': return { c: this.L.vars(this.owner(node), node.name), t: 'any' };
        case 'listcontents': return { c: this.call(`lists.${this.m('join')}`, this.L.lists(this.owner(node), node.name)), t: 'str' };
        case 'param': {
            const p = this.params && this.params.get(node.name);
            if (p) return { c: p, t: node.boolean ? 'any' : 'any' };
            return node.boolean ? { c: this.L.FALSE, t: 'bool' } : { c: '0', t: 'num' };
        }
        case 'op': return this.op(node);
        default: return { c: this.L.str(''), t: 'str' };
        }
    }
    a (node, k) { return this.e(node.args[k]).c; }
    cond (expr) { return expr.t === 'bool' ? expr.c : this.call(this.h('bool'), expr.c); }

    op (n) {
        const L = this.L, h = x => this.h(x), m = x => this.m(x);
        const A = k => this.a(n, k);
        const f = k => n.fields[k];
        const B = (c) => ({ c, t: 'bool' }), N = c => ({ c, t: 'num' }), S = c => ({ c, t: 'str' }), X = c => ({ c, t: 'any' });
        switch (n.op) {
        case 'operator_add': return N(this.call(h('add'), A('NUM1'), A('NUM2')));
        case 'operator_subtract': return N(this.call(h('sub'), A('NUM1'), A('NUM2')));
        case 'operator_multiply': return N(this.call(h('mul'), A('NUM1'), A('NUM2')));
        case 'operator_divide': return N(this.call(h('div'), A('NUM1'), A('NUM2')));
        case 'operator_mod': return N(this.call(h('mod'), A('NUM1'), A('NUM2')));
        case 'operator_round': return N(this.call(h('round'), A('NUM')));
        case 'operator_random': return N(this.call(h('random'), 'game', A('FROM'), A('TO')));
        case 'operator_gt': return B(this.call(h('gt'), A('OPERAND1'), A('OPERAND2')));
        case 'operator_lt': return B(this.call(h('lt'), A('OPERAND1'), A('OPERAND2')));
        case 'operator_equals': return B(this.call(h('eq'), A('OPERAND1'), A('OPERAND2')));
        case 'operator_and': return B(L.and(this.cond(this.e(n.args.OPERAND1)), this.cond(this.e(n.args.OPERAND2))));
        case 'operator_or': return B(L.or(this.cond(this.e(n.args.OPERAND1)), this.cond(this.e(n.args.OPERAND2))));
        case 'operator_not': return B(L.not(this.cond(this.e(n.args.OPERAND))));
        case 'operator_join': return S(this.call(h('join'), A('STRING1'), A('STRING2')));
        case 'operator_letter_of': return S(this.call(h('letterOf'), A('LETTER'), A('STRING')));
        case 'operator_length': return N(this.call(h('length'), A('STRING')));
        case 'operator_contains': return B(this.call(h('contains'), A('STRING1'), A('STRING2')));
        case 'operator_mathop': return N(this.call(h('mathop'), L.str(f('OPERATOR')), A('NUM')));
        case 'motion_xposition': return N(`self.${m('getX')}()`);
        case 'motion_yposition': return N(`self.${m('getY')}()`);
        case 'motion_direction': return N('self.direction');
        case 'looks_size': return N(`self.${m('getSize')}()`);
        case 'looks_costumenumbername': return f('NUMBER_NAME') === 'name' ? S(`self.${m('costumeName')}()`) : N(`self.${m('costumeNumber')}()`);
        case 'looks_backdropnumbername': return f('NUMBER_NAME') === 'name' ? S(`stage.${m('backdropName')}()`) : N(`stage.${m('backdropNumber')}()`);
        case 'sound_volume': return N('self.volume');
        case 'sensing_touchingobject': return B(`self.${m('touching')}(${A('TOUCHINGOBJECTMENU')})`);
        case 'sensing_distanceto': return N(`self.${m('distanceTo')}(${A('DISTANCETOMENU')})`);
        case 'sensing_keypressed': return B(`game.${m('keyPressed')}(${A('KEY_OPTION')})`);
        case 'sensing_mousedown': return B('game.mouse.down');
        case 'sensing_mousex': return N('game.mouse.x');
        case 'sensing_mousey': return N('game.mouse.y');
        case 'sensing_timer': return N('game.timer()');
        case 'sensing_answer': return S('game.answer');
        case 'sensing_of': return X(this.call(h('attributeOf'), 'game', L.str(f('PROPERTY')), A('OBJECT')));
        case 'sensing_current': return N(this.call(h('current'), L.str(f('CURRENTMENU'))));
        case 'sensing_dayssince2000': return N(`${h('daysSince2000')}()`);
        case 'sensing_username': return S(L.str(''));
        case 'data_itemoflist': return X(this.call(`lists.${m('item')}`, 'game', this.list(n), A('INDEX')));
        case 'data_itemnumoflist': return N(this.call(`lists.${m('indexOf')}`, this.list(n), A('ITEM')));
        case 'data_lengthoflist': return N(this.call(`lists.${m('length')}`, this.list(n)));
        case 'data_listcontainsitem': return B(this.call(`lists.${m('contains')}`, this.list(n), A('ITEM')));
        default:
            return X(`${L.NULL} ${L.comment === '//' ? '/* unsupported ' + n.op + ' */' : ''}`.trim());
        }
    }
    list (n) { return this.L.lists(this.owner(n.list), n.list.name); }
    varRef (n) { return this.L.vars(this.owner(n.variable), n.variable.name); }

    // ------------------------------------------------------------ statements

    stack (nodes, depth, out) {
        const before = out.length;
        for (const n of nodes) this.stmt(n, depth, out);
        if (out.length === before && this.L.pass) out.push(IND.repeat(depth) + this.L.pass);
    }

    stmt (n, d, out) {
        this.stmt1(n, d, out);
        if (n.trailingPromise) out.push(IND.repeat(d) + this.L.assign(n.trailingPromise, this.L.TRUE));
    }

    stmt1 (n, d, out) {
        const L = this.L, m = x => this.m(x), h = x => this.h(x);
        const p = IND.repeat(d);
        const A = k => this.a(n, k);
        const f = k => n.fields[k];
        const S = s => out.push(p + L.stmt(s));
        const YF = e => out.push(p + L.yieldFrom(e));
        const block = (open, body, isLoop) => {
            out.push(p + open);
            // scratch-vm: when a promise block (say/think for secs, ask, play until
            // done) is the last statement run in an iteration, its resolution jumps
            // straight back to the loop and the end-of-iteration yield is skipped.
            const pe = isLoop && markTrailingPromise(body || [], `pe${this.loop + 1}`);
            if (pe) { this.loop++; out.push(IND.repeat(d + 1) + (L.name === 'js' ? `let ${pe} = false;` : L.assign(pe, L.FALSE))); }
            this.stack(body || [], d + 1, out);
            if (pe) out.push(IND.repeat(d + 1) + (L.name === 'js' ? `if (!${pe}) yield;` : `if not ${pe}:`), ...(L.name === 'js' ? [] : [IND.repeat(d + 2) + 'yield']));
            else if (isLoop) out.push(IND.repeat(d + 1) + L.yield);
            if (L.close) out.push(p + L.close);
        };
        switch (n.op) {
        // motion
        case 'motion_movesteps': return S(`self.${m('move')}(${A('STEPS')})`);
        case 'motion_turnright': return S(`self.${m('turnRight')}(${A('DEGREES')})`);
        case 'motion_turnleft': return S(`self.${m('turnLeft')}(${A('DEGREES')})`);
        case 'motion_gotoxy': return S(`self.${m('goTo')}(${A('X')}, ${A('Y')})`);
        case 'motion_goto': return S(`self.${m('goToTarget')}(${A('TO')})`);
        case 'motion_glidesecstoxy': return YF(`self.${m('glideTo')}(${A('SECS')}, ${A('X')}, ${A('Y')})`);
        case 'motion_glideto': return YF(`self.${m('glideToTarget')}(${A('SECS')}, ${A('TO')})`);
        case 'motion_changexby': return S(`self.${m('changeX')}(${A('DX')})`);
        case 'motion_setx': return S(`self.${m('setX')}(${A('X')})`);
        case 'motion_changeyby': return S(`self.${m('changeY')}(${A('DY')})`);
        case 'motion_sety': return S(`self.${m('setY')}(${A('Y')})`);
        case 'motion_pointindirection': return S(`self.${m('pointInDirection')}(${A('DIRECTION')})`);
        case 'motion_pointtowards': return S(`self.${m('pointTowards')}(${A('TOWARDS')})`);
        case 'motion_ifonedgebounce': return S(`self.${m('ifOnEdgeBounce')}()`);
        case 'motion_setrotationstyle': return S(`self.${m('setRotationStyle')}(${L.str(f('STYLE'))})`);
        // looks
        case 'looks_switchcostumeto': return S(`self.${m('switchCostume')}(${A('COSTUME')})`);
        case 'looks_nextcostume': return S(`self.${m('nextCostume')}()`);
        case 'looks_switchbackdropto': return S(`stage.${m('switchBackdrop')}(${A('BACKDROP')})`);
        case 'looks_switchbackdroptoandwait': return YF(`stage.${m('switchBackdropAndWait')}(${A('BACKDROP')})`);
        case 'looks_nextbackdrop': return S(`stage.${m('nextBackdrop')}()`);
        case 'looks_show': return S(`self.${m('show')}()`);
        case 'looks_hide': return S(`self.${m('hide')}()`);
        case 'looks_changesizeby': return S(`self.${m('changeSize')}(${A('CHANGE')})`);
        case 'looks_setsizeto': return S(`self.${m('setSize')}(${A('SIZE')})`);
        case 'looks_say': return S(`self.${m('say')}(${A('MESSAGE')})`);
        case 'looks_think': return S(`self.${m('think')}(${A('MESSAGE')})`);
        case 'looks_sayforsecs': return YF(`self.${m('sayFor')}(${A('MESSAGE')}, ${A('SECS')})`);
        case 'looks_thinkforsecs': return YF(`self.${m('thinkFor')}(${A('MESSAGE')}, ${A('SECS')})`);
        case 'looks_gotofrontback': return S(`self.${m(f('FRONT_BACK') === 'back' ? 'goToBack' : 'goToFront')}()`);
        case 'looks_goforwardbackwardlayers': return S(`self.${m(f('FORWARD_BACKWARD') === 'backward' ? 'goBackward' : 'goForward')}(${A('NUM')})`);
        case 'looks_seteffectto': return S(`self.${m('setEffect')}(${L.str(f('EFFECT'))}, ${A('VALUE')})`);
        case 'looks_changeeffectby': return S(`self.${m('changeEffect')}(${L.str(f('EFFECT'))}, ${A('CHANGE')})`);
        case 'looks_cleargraphiceffects': return S(`self.${m('clearEffects')}()`);
        // sound
        case 'sound_play': return S(`self.${m('startSound')}(${A('SOUND_MENU')})`);
        case 'sound_playuntildone': return YF(`self.${m('playSoundUntilDone')}(${A('SOUND_MENU')})`);
        case 'sound_stopallsounds': return S(`game.audio.${m('stopAll')}()`);
        case 'sound_setvolumeto': return S(`self.${m('setVolume')}(${A('VOLUME')})`);
        case 'sound_changevolumeby': return S(`self.${m('changeVolume')}(${A('VOLUME')})`);
        case 'sound_seteffectto': case 'sound_changeeffectby': case 'sound_cleareffects':
            return out.push(`${p}${L.comment} ${n.op}: sound effects are not rendered`);
        // events
        case 'event_broadcast': return S(`game.broadcast(${A('BROADCAST_INPUT')})`);
        case 'event_broadcastandwait': return YF(`game.${m('broadcastAndWait')}(${A('BROADCAST_INPUT')})`);
        // control
        case 'control_wait': return YF(`game.wait(${A('DURATION')})`);
        case 'control_repeat': return block(L.repeatOpen(`i${++this.loop}`, A('TIMES')), n.sub, true);
        case 'control_forever': return block(L.foreverOpen, n.sub, true);
        case 'control_if': return block(L.ifOpen(this.cond(this.e(n.args.CONDITION))), n.sub, false);
        case 'control_if_else': {
            out.push(p + L.ifOpen(this.cond(this.e(n.args.CONDITION))));
            this.stack(n.sub || [], d + 1, out);
            out.push(p + L.elseOpen);
            this.stack(n.sub2 || [], d + 1, out);
            if (L.close) out.push(p + L.close);
            return;
        }
        case 'control_wait_until': return YF(`game.${m('waitUntil')}(${L.lambda(this.cond(this.e(n.args.CONDITION)))})`);
        case 'control_repeat_until': return block(L.whileOpen(L.not(this.cond(this.e(n.args.CONDITION)))), n.sub, true);
        case 'control_stop': {
            const o = f('STOP_OPTION');
            if (o === 'all') return S(`game.${m('stopAllAndThrow')}()`);
            if (o === 'this script') return out.push(p + L.ret);
            return S(`game.${m('stopOtherScripts')}(self)`);
        }
        case 'control_create_clone_of': return S(`self.${m('createClone')}(${A('CLONE_OPTION')})`);
        case 'control_delete_this_clone': return S(`self.${m('deleteThisClone')}()`);
        // sensing
        case 'sensing_askandwait': return YF(`game.ask(self, ${A('QUESTION')})`);
        case 'sensing_resettimer': return S(`game.${m('resetTimer')}()`);
        case 'sensing_setdragmode': return out.push(`${p}${L.comment} set drag mode: dragging is not implemented`);
        // data
        case 'data_setvariableto': return out.push(p + L.assign(this.varRef(n), A('VALUE')));
        case 'data_changevariableby': { const r = this.varRef(n); return out.push(p + L.assign(r, this.call(h('add'), r, A('VALUE')))); }
        case 'data_showvariable': case 'data_hidevariable':
            return S(`game.${m('showVariable')}(${L.str(this.owner(n.variable) === 'self' ? this.cur.name : '_stage_')}, ${L.str(n.variable.name)}, ${n.op === 'data_showvariable' ? L.TRUE : L.FALSE})`);
        case 'data_addtolist': return S(`lists.add(${this.list(n)}, ${A('ITEM')})`);
        case 'data_deleteoflist': return S(`lists.delete(game, ${this.list(n)}, ${A('INDEX')})`);
        case 'data_deletealloflist': return S(`lists.clear(${this.list(n)})`);
        case 'data_insertatlist': return S(`lists.insert(game, ${this.list(n)}, ${A('INDEX')}, ${A('ITEM')})`);
        case 'data_replaceitemoflist': return S(`lists.replace(game, ${this.list(n)}, ${A('INDEX')}, ${A('ITEM')})`);
        case 'data_showlist': case 'data_hidelist': return out.push(`${p}${L.comment} ${n.op}: list monitors are not drawn`);
        // pen
        case 'pen_clear': return S('game.pen.clear()');
        case 'pen_stamp': return S('self.stamp()');
        case 'pen_penDown': return S(`self.${m('penDown')}()`);
        case 'pen_penUp': return S(`self.${m('penUp')}()`);
        case 'pen_setPenColorToColor': return S(`self.${m('setPenColor')}(${A('COLOR')})`);
        case 'pen_changePenColorParamBy': return S(`self.${m('changePenParam')}(${A('COLOR_PARAM')}, ${A('VALUE')})`);
        case 'pen_setPenColorParamTo': return S(`self.${m('setPenParam')}(${A('COLOR_PARAM')}, ${A('VALUE')})`);
        case 'pen_changePenSizeBy': return S(`self.${m('changePenSize')}(${A('SIZE')})`);
        case 'pen_setPenSizeTo': return S(`self.${m('setPenSize')}(${A('SIZE')})`);
        // procedures
        case 'procedures_call': {
            const proc = this.procs.get(n.proccode);
            if (!proc) return out.push(`${p}${L.comment} call to undefined block ${JSON.stringify(n.proccode)}`);
            const args = proc.argIdsOrder.map((_, i) => {
                const id = n.argIds[i];
                return id !== undefined && n.args[id] ? this.e(n.args[id]).c : (proc.boolean[i] ? L.FALSE : L.str(''));
            });
            const callExpr = `${proc.fn}(${['self', ...args].join(', ')})`;
            return YF(proc.warp ? `game.warp(${callExpr})` : callExpr);
        }
        default:
            return out.push(`${p}${L.comment} UNSUPPORTED ${n.op}`);
        }
    }

    // ------------------------------------------------------------ module

    emit () {
        const L = this.L;
        const out = [];
        const fnNames = [];
        const body = [];
        for (const t of this.model.code) {
            this.cur = t;
            const tid = ident(t.isStage ? 'stage' : t.name, null);
            const key = t.isStage ? '_stage_' : t.name;
            this.procs = new Map();
            for (const pr of t.procs) {
                const label = pr.proccode.replace(/%[snb]/g, '').trim() || 'block';
                const fn = ident(`${tid}_${label}`, this.used);
                const boolean = (pr.proccode.match(/%[snb]/g) || []).map(x => x === '%b');
                this.procs.set(pr.proccode, { fn, warp: pr.warp, argIdsOrder: pr.params, boolean, def: pr });
            }
            if (!t.scripts.length && !t.procs.length) continue;
            body.push('', `${IND}${L.comment} ---- ${t.isStage ? 'Stage' : `Sprite: ${t.name}`}`);
            for (const pr of this.procs.values()) {
                const used = new Set();
                this.params = new Map(pr.def.params.map(nm => [nm, ident(`p_${nm}`, used)]));
                body.push(...this.fn(pr.fn, ['self', ...this.params.values()], pr.def.body, `${L.comment} define ${pr.def.proccode}${pr.warp ? ' (run without screen refresh)' : ''}`));
                this.params = null;
            }
            let i = 0;
            for (const sc of t.scripts) {
                if (sc.hat.kind === 'unsupported') continue;
                const base = { flag: 'when_flag_clicked', key: `when_${sc.hat.arg}_key_pressed`, broadcast: `when_i_receive_${sc.hat.arg}`, clicked: 'when_clicked', clone: 'when_i_start_as_a_clone', backdrop: `when_backdrop_switches_to_${sc.hat.arg}` }[sc.hat.kind];
                const fn = ident(`${tid}_${base}`, this.used);
                body.push(...this.fn(fn, ['self'], sc.body, null));
                fnNames.push([key, sc.hat.kind, sc.hat.arg, fn]);
                i++;
            }
        }
        const reg = fnNames.map(([key, kind, arg, fn]) => `${IND}${L.stmt(`game.on(${L.str(key)}, ${L.str(kind)}, ${arg === null ? L.NULL : L.str(arg)}, ${fn})`)}`);
        return { body, reg };
    }

    fn (name, params, stmts, comment) {
        const L = this.L;
        const out = [];
        if (comment) out.push(IND + comment);
        out.push(IND + L.defOpen(name, params));
        const inner = [];
        this.stack(stmts, 2, inner);
        if (L.name === 'py' && !inner.some(l => /\byield\b/.test(l))) {
            // a Python function only becomes a generator if it yields somewhere
            if (inner.length === 1 && inner[0].trim() === 'pass') inner.length = 0;
            inner.push(`${IND}${IND}yield from ()`);
        }
        out.push(...inner);
        for (const c of L.defClose()) out.push(IND + c);
        return out;
    }
}

const JS_HELPERS = ['WAIT', 'times', 'num', 'str', 'bool', 'eq', 'lt', 'gt', 'add', 'sub', 'mul', 'div', 'mod', 'round', 'join', 'letterOf', 'length', 'contains', 'mathop', 'lists', 'random', 'attributeOf', 'current', 'daysSince2000'];

export function emitGame (model, lang, meta = {}) {
    const L = lang === 'py' ? PY : JS;
    const em = new Emitter(L, model);
    const { body, reg } = em.emit();
    const head = [
        `${L.comment} Generated by Brickwright game export (bwgame-v1).`,
        `${L.comment} Source project: ${meta.title || 'untitled'}. Edit freely; this file is yours.`,
        `${L.comment} Every script is a generator: a loop yields once per frame, a wait yields until`,
        `${L.comment} its time has passed. 'self' is the sprite (or clone) running the script.`,
        ''
    ];
    if (L.name === 'js') {
        return [...head,
            `import { ${JS_HELPERS.join(', ')} } from './bwgame.js';`,
            '',
            'export default function setup (game) {',
            '    const stage = game.stage;',
            ...body,
            '',
            '    // ---- hats',
            ...reg,
            '}',
            ''].join('\n');
    }
    const pyHelpers = JS_HELPERS.map(n => PY.h(n));
    return [...head,
        `from bwgame import ${pyHelpers.join(', ')}  # noqa: F401`,
        '',
        '',
        'def setup(game):',
        '    stage = game.stage',
        ...body,
        '',
        '    # ---- hats',
        ...reg,
        ''].join('\n');
}
