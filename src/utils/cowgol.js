/**
 * Cowgol's deliberately bounded Brickwright bridge. The executable subset uses
 * signed 32-bit integers, one flag script, and the explicit brickwright.coh host
 * ABI. Failed conversions return no executable replacement. Source is retained
 * in `preview`; callers MUST check `ok` before replacing a project or running it.
 * No JavaScript evaluation or regex replacement inside quoted strings is used.
 */

const INTEGER = /^-?\d+$/;
const IDENT = /^[A-Za-z_][A-Za-z_0-9]*$/;
const q = value => JSON.stringify(String(value));
const isInt32 = value => Number.isInteger(Number(value)) && Number(value) >= -2147483648 && Number(value) <= 2147483647;
const diagnostic = (message, detail = {}) => ({severity: 'error', code: 'cowgol-unsupported', message, ...detail});

/** Logical host pin IDs, not an assertion of a native Cowgol MCU backend. */
export function cowgolPinId(device, where) {
    const d = String(device || '').toLowerCase();
    const p = String(where || '').toUpperCase();
    let m;
    if (['arduino-uno', 'arduino-nano', 'arduino-mega'].includes(d)) {
        const mega = d === 'arduino-mega';
        if ((m = /^D(\d+)$/.exec(p)) && +m[1] <= (mega ? 53 : 13)) return +m[1];
        if ((m = /^A(\d+)$/.exec(p)) && +m[1] <= (mega ? 15 : 5)) return (mega ? 54 : 14) + +m[1];
    }
    if (d === 'pico' && (m = /^GP(\d+)$/.exec(p)) && (+m[1] <= 22 || (+m[1] >= 25 && +m[1] <= 28))) return +m[1];
    if (/^stc(?:12|15|89)/.test(d) && (m = /^P([0-7])\.([0-7])$/.exec(p))) return +m[1] * 8 + +m[2];
    return null;
}

/** Generate from the existing project graph rather than reparsing display text. */
export function generateCowgol(creator, project = creator.project, opts = {}) {
    const diagnostics = [], warnings = [];
    const fail = (message, block = null) => diagnostics.push(diagnostic(message, {
        opcode: block?.opcode || null, blockId: blockIds.get(block) || null
    }));
    const blockIds = new Map();
    const targets = project?.targets || [];
    const scripts = [], procs = [];
    for (const target of targets) {
        for (const [id, b] of Object.entries(target.blocks || {})) {
            blockIds.set(b, id);
            if (!b.topLevel) continue;
            if (b.opcode === 'event_whenflagclicked') scripts.push({target, b});
            else if (b.opcode === 'procedures_definition') procs.push({target, b});
            else fail(`Event ${b.opcode} requires a concurrent/event runtime`, b);
        }
        if (Object.keys(target.lists || {}).length) fail('Lists and arrays are not in the Cowgol integer subset');
    }
    if (scripts.length !== 1) fail(`Cowgol requires exactly one flag script; found ${scripts.length}`);
    if (procs.length) fail('Custom procedures are not yet emitted by this Cowgol generator');
    const active = scripts[0]?.target || targets.find(t => !t.isStage) || targets[0] || {};
    const stc = project.stc || creator.constructor.readStc?.(project) || {};
    if ((creator.constructor.readBoards?.(project) || []).length > 1) fail('Cowgol host conversion accepts one declared board');
    if (Object.keys(stc.ports || {}).length || Object.keys(stc.parts || {}).length) fail('PORT and PART peripherals need a dedicated Cowgol host binding');
    const pins = new Map();
    const ids = new Set();
    for (const pin of stc.pins || []) {
        const where = pin.where || `P${pin.port}.${pin.bit}`;
        const id = cowgolPinId(stc.device, where);
        if (id === null) fail(`No Cowgol host pin map for ${stc.device || '(no device)'} ${where}`);
        if (ids.has(id)) fail(`Aliased pin ${where} needs an explicit shared-pin contract`);
        ids.add(id);
        if (!['input', 'output'].includes(pin.direction)) fail(`Pin ${pin.name} mode ${pin.direction} is not a digital mode`);
        pins.set(pin.name, {...pin, where, id});
    }
    const variables = new Map();
    const names = new Map();
    const targetVars = [targets.find(t => t.isStage), ...(active.isStage ? [] : [active])].filter(Boolean);
    for (const t of targetVars) for (const [id, [name, initial]] of Object.entries(t.variables || {})) {
        const v = {id: `bw_v${variables.size}`, name, initial, scope: t.isStage ? 'global' : 'local', type: 'number'};
        if (typeof initial === 'string' && !isInt32(initial)) v.type = 'string';
        variables.set(id, v);
        if (names.has(name) && names.get(name).scope === v.scope) fail(`Ambiguous variable ${name}`);
        names.set(name, v);
    }
    const blocks = active.blocks || {};
    const variable = field => variables.get(field?.[1]) || names.get(field?.[0]);
    // Infer literal-string variables before emission; mixed types still refuse.
    for (const b of Object.values(blocks)) if (b.opcode === 'data_setvariableto') {
        const raw = b.inputs?.VALUE?.[1], v = variable(b.fields?.VARIABLE);
        if (v && Array.isArray(raw) && raw[0] === 10) v.type = 'string';
    }
    const value = (input, owner) => {
        const raw = input?.[1];
        if (Array.isArray(raw)) {
            if (raw[0] === 12) {
                const v = variables.get(raw[2]) || names.get(raw[1]);
                if (!v) { fail(`Unknown variable ${raw[1]}`, owner); return {code: '0', type: 'number'}; }
                return {code: v.id, type: v.type};
            }
            if (raw[0] === 9 && /^#[\da-f]{6}$/i.test(raw[1])) return {code: String(parseInt(raw[1].slice(1), 16)), type: 'number'};
            if (raw[0] === 10) {
                if (String(raw[1]).includes('\0')) fail('Embedded NUL cannot round-trip through Cowgol text', owner);
                return {code: q(raw[1]), type: 'string'};
            }
            if (isInt32(raw[1]) && String(raw[1]).trim() !== '') return {code: String(Number(raw[1])), type: 'number'};
            fail(`Value ${q(raw[1])} is outside the signed integer subset`, owner);
            return {code: '0', type: 'number'};
        }
        const b = blocks[raw];
        if (!b) { fail('Missing expression', owner); return {code: '0', type: 'number'}; }
        const n = key => numeric(b.inputs?.[key], b);
        const operators = {operator_add: '+', operator_subtract: '-', operator_multiply: '*', bitops_and: '&', bitops_or: '|', bitops_xor: '^'};
        if (operators[b.opcode]) return {code: `(${n('NUM1')} ${operators[b.opcode]} ${n('NUM2')})`, type: 'number'};
        if (b.opcode === 'motion_xposition') return {code: 'bw_x()', type: 'number'};
        if (b.opcode === 'motion_yposition') return {code: 'bw_y()', type: 'number'};
        if (b.opcode === 'motion_direction') return {code: 'bw_direction()', type: 'number'};
        if (b.opcode === 'stc12_read') {
            const p = pins.get(b.fields?.PIN?.[0]);
            if (!p) fail(`Undeclared pin ${b.fields?.PIN?.[0]}`, b);
            const code = `bw_digital_read(${p?.id ?? 0})`;
            return {code: p?.activeLow ? `(1 - ${code})` : code, type: 'number'};
        }
        fail(`Reporter ${b.opcode} has no lossless Cowgol integer lowering`, b);
        return {code: '0', type: 'number'};
    };
    const numeric = (input, owner) => {
        const v = value(input, owner);
        if (v.type !== 'number') fail('A numeric Cowgol expression cannot contain text', owner);
        return v.code;
    };
    const condition = (input, owner) => {
        const b = blocks[input?.[1]];
        if (!b) return `${numeric(input, owner)} != 0`;
        const operators = {operator_equals: '==', operator_lt: '<', operator_gt: '>'};
        if (operators[b.opcode]) return `(${numeric(b.inputs.OPERAND1, b)} ${operators[b.opcode]} ${numeric(b.inputs.OPERAND2, b)})`;
        if (b.opcode === 'operator_and' || b.opcode === 'operator_or') return `(${condition(b.inputs.OPERAND1, b)} ${b.opcode === 'operator_and' ? 'and' : 'or'} ${condition(b.inputs.OPERAND2, b)})`;
        if (b.opcode === 'operator_not') return `(not ${condition(b.inputs.OPERAND, b)})`;
        return `${numeric(input, owner)} != 0`;
    };
    const out = ['# Generated by Brickwright: Cowgol integer/host subset v1',
        '# Arithmetic is signed int32; values must remain in range.', 'include "cowgol.coh";', 'include "brickwright.coh";'];
    const declaration = text => out.push(`# @bw-declaration ${q(text)}`);
    if (stc.device) declaration(`DEVICE ${String(stc.device).toUpperCase()}`);
    for (const p of pins.values()) declaration(`PIN ${p.name} = ${p.where} ${p.direction.toUpperCase()}${p.activeLow ? ' ACTIVE LOW' : ''}`);
    out.push(`# @bw-target ${JSON.stringify({isStage: !!active.isStage, name: active.name || 'Sprite1', shape: active.costumes?.[0]?._shapeSpec || null})}`);
    for (const v of variables.values()) {
        out.push(`# @bw-variable ${JSON.stringify({id: v.id, name: v.name, scope: v.scope})}`);
        let initial = v.type === 'string' ? q(v.initial ?? '') : String(Number(v.initial || 0));
        if (v.type === 'number' && !isInt32(initial)) { fail(`Initial value of ${v.name} is outside int32`); initial = '0'; }
        out.push(`var ${v.id}: ${v.type === 'string' ? '[uint8]' : 'int32'} := ${initial};`);
    }
    for (const p of pins.values()) out.push(`bw_pin_mode(${p.id ?? 0}, ${p.direction === 'output' ? 1 : p.activeLow ? 2 : 0});`);
    let loopSeq = 0, mapped = 0;
    const emit = (depth, line) => out.push('    '.repeat(depth) + line);
    const chain = (first, depth) => {
        let id = first;
        const visited = new Set();
        while (id) {
            if (visited.has(id) || !blocks[id]) { fail('Malformed or cyclic block stack'); break; }
            visited.add(id);
            const b = blocks[id], f = key => b.fields?.[key]?.[0], n = key => numeric(b.inputs?.[key], b);
            const call = (name, args = []) => emit(depth, `${name}(${args.join(', ')});`);
            const sub = key => chain(b.inputs?.[key]?.[1], depth + 1);
            switch (b.opcode) {
            case 'data_setvariableto': case 'data_changevariableby': {
                const v = variable(b.fields.VARIABLE), rhs = value(b.inputs.VALUE, b);
                if (!v) { fail(`Undeclared variable ${f('VARIABLE')}`, b); break; }
                if (rhs.type !== v.type || (b.opcode === 'data_changevariableby' && rhs.type !== 'number')) fail(`Mixed numeric/text variable ${v.name}`, b);
                emit(depth, `${v.id} := ${b.opcode === 'data_changevariableby' ? `${v.id} + ` : ''}${rhs.code};`);
                break;
            }
            case 'looks_say': case 'stc12_print': {
                const v = value(b.inputs[b.opcode === 'looks_say' ? 'MESSAGE' : 'VALUE'], b);
                call(v.type === 'string' ? 'bw_print_text' : 'bw_print_number', [v.code]); break;
            }
            case 'control_if': case 'control_if_else':
                emit(depth, `if ${condition(b.inputs.CONDITION, b)} then`); sub('SUBSTACK');
                if (b.opcode === 'control_if_else') { emit(depth, 'else'); sub('SUBSTACK2'); }
                emit(depth, 'end if;'); break;
            case 'control_repeat': {
                const count = `bw_repeat${loopSeq++}`;
                emit(depth, `var ${count}: int32 := ${n('TIMES')};`);
                emit(depth, `while ${count} > 0 loop`); sub('SUBSTACK');
                emit(depth + 1, `${count} := ${count} - 1;`); emit(depth, 'end loop;'); break;
            }
            case 'control_repeat_until':
                emit(depth, `while not (${condition(b.inputs.CONDITION, b)}) loop`); sub('SUBSTACK'); emit(depth, 'end loop;'); break;
            case 'control_forever': emit(depth, 'loop'); sub('SUBSTACK'); emit(depth, 'end loop;'); break;
            case 'control_wait': {
                const raw = b.inputs.DURATION?.[1];
                if (!Array.isArray(raw) || !Number.isFinite(Number(raw[1])) || Number(raw[1]) < 0 || Number(raw[1]) > 2147483.647) fail('Wait requires a nonnegative literal duration within int32 milliseconds', b);
                else call('bw_delay', [String(Math.round(Number(raw[1]) * 1000))]);
                break;
            }
            case 'control_stop':
                if (f('STOP_OPTION') !== 'all') fail('Only stop all has a qualified Cowgol lowering', b);
                else call('Exit'); break;
            case 'pen_clear': call('bw_canvas_clear', ['0']); break;
            case 'pen_penDown': call('bw_pen_down'); break;
            case 'pen_penUp': call('bw_pen_up'); break;
            case 'pen_setPenColorToColor': call('bw_pen_colour', [n('COLOR')]); break;
            case 'pen_setPenSizeTo': call('bw_pen_size', [n('SIZE')]); break;
            case 'motion_gotoxy': call('bw_go_to', [n('X'), n('Y')]); break;
            case 'motion_movesteps': call('bw_move', [n('STEPS')]); break;
            case 'motion_turnright': call('bw_turn', [n('DEGREES')]); break;
            case 'motion_turnleft': call('bw_turn', [`(0 - ${n('DEGREES')})`]); break;
            case 'motion_pointindirection': call('bw_point_direction', [n('DIRECTION')]); break;
            case 'motion_setx': call('bw_go_to', [n('X'), 'bw_y()']); break;
            case 'motion_sety': call('bw_go_to', ['bw_x()', n('Y')]); break;
            case 'motion_changexby': call('bw_go_to', [`(bw_x() + ${n('DX')})`, 'bw_y()']); break;
            case 'motion_changeyby': call('bw_go_to', ['bw_x()', `(bw_y() + ${n('DY')})`]); break;
            case 'stc12_setpin': case 'stc12_writepin': case 'stc12_toggle': {
                const p = pins.get(f('PIN'));
                if (!p || p.direction !== 'output') { fail(`Pin ${f('PIN')} is not a declared digital output`, b); break; }
                if (b.opcode === 'stc12_toggle') call('bw_digital_toggle', [String(p.id)]);
                else if (b.opcode === 'stc12_writepin') {
                    emit(depth, `if ${n('VALUE')} != 0 then`);
                    emit(depth + 1, `bw_digital_write(${p.id}, 1);`); emit(depth, 'else');
                    emit(depth + 1, `bw_digital_write(${p.id}, 0);`); emit(depth, 'end if;');
                } else {
                    const state = f('STATE');
                    if (!['high', 'low', 'on', 'off'].includes(state)) fail(`Unknown pin state ${state}`, b);
                    const high = state === 'high' || ((state === 'on' || state === 'off') && ((state === 'on') !== !!p.activeLow));
                    call('bw_digital_write', [String(p.id), high ? '1' : '0']);
                }
                break;
            }
            default: fail(`Statement ${b.opcode} has no qualified Cowgol lowering`, b);
            }
            mapped++; id = b.next;
        }
    };
    chain(scripts[0]?.b.next, 0);
    const preview = out.join('\n') + '\n';
    const ok = diagnostics.length === 0;
    return {ok, ...(ok ? {cowgol: preview} : {}), preview, warnings,
        reasons: diagnostics.map(d => d.message), diagnostics, stats: {mapped, unsupported: diagnostics.length}, profile: opts.profile || 'host-int32'};
}

// A lexer is necessary here: semicolons, # and operator-looking text inside
// strings must remain data, including after escaped quotes and backslashes.
function lex(source) {
    const tokens = [];
    let i = 0, line = 1;
    while (i < source.length) {
        const ch = source[i];
        if (/\s/.test(ch)) { if (ch === '\n') line++; i++; continue; }
        if (ch === '#') {
            const end = source.indexOf('\n', i), stop = end < 0 ? source.length : end;
            const text = source.slice(i + 1, stop).trim();
            if (text.startsWith('@bw-')) tokens.push({kind: 'meta', text, line});
            i = stop; continue;
        }
        if (ch === '"') {
            let text = '"', closed = false; const at = line; i++;
            while (i < source.length) {
                const c = source[i++]; text += c;
                if (c === '\n') throw new Error(`Line ${at}: newline in a string literal`);
                if (c === '\\') { text += source[i++] || ''; continue; }
                if (c === '"') { closed = true; break; }
            }
            if (!closed) throw new Error(`Line ${at}: unterminated string literal`);
            let value;
            try { value = JSON.parse(text); } catch { throw new Error(`Line ${at}: unsupported string escape`); }
            if (value.includes('\0')) throw new Error(`Line ${at}: embedded NUL cannot round-trip as Cowgol text`);
            tokens.push({kind: 'string', text: q(value), line: at}); continue;
        }
        const rest = source.slice(i);
        const number = /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|0d[0-9_]+|[0-9][0-9_]*)/.exec(rest);
        if (number) {
            const raw = number[0].replace(/_/g, '').replace(/^0d/, '');
            tokens.push({kind: 'number', text: String(Number(raw)), line}); i += number[0].length; continue;
        }
        const name = /^[A-Za-z_][A-Za-z_0-9]*/.exec(rest);
        if (name) { tokens.push({kind: 'name', text: name[0], line}); i += name[0].length; continue; }
        const op = /^(?::=|==|!=|<=|>=|<<|>>|[()+\-*/%&|^~<>,;:\[\]])/.exec(rest);
        if (!op) throw new Error(`Line ${line}: unsupported token ${q(ch)}`);
        tokens.push({kind: 'op', text: op[0], line}); i += op[0].length;
    }
    tokens.push({kind: 'eof', text: '<eof>', line});
    return tokens;
}

const PRECEDENCE = {or: 1, and: 2, '==': 3, '!=': 3, '<': 3, '>': 3, '<=': 3, '>=': 3,
    '|': 4, '^': 5, '&': 6, '+': 7, '-': 7, '*': 8, '/': 8, '%': 8};
const PSEUDO_OP = {'==': '=', '&': 'bitand', '|': 'bitor', '^': 'bitxor'};

class Reader {
    constructor(source, opts) {
        this.tokens = lex(source); this.i = 0; this.opts = opts;
        this.vars = new Map(); this.aliases = new Map(); this.procs = new Map();
        this.globals = []; this.locals = []; this.declarations = []; this.main = []; this.definitions = [];
        this.target = {isStage: true, name: 'Stage'}; this.pins = new Map(); this.device = opts.device || null;
        this.stats = {lines: source.split(/\r?\n/).length, mapped: 0}; this.depth = 0;
    }
    peek(text) { return text === undefined ? this.tokens[this.i] : this.tokens[this.i].text === text; }
    take(text) {
        const t = this.tokens[this.i];
        if (text !== undefined && t.text !== text) this.error(`Expected ${text}, found ${t.text}`);
        this.i++; return t;
    }
    error(message) { throw new Error(`Line ${this.peek().line}: ${message}`); }
    name() { const t = this.take(); if (t.kind !== 'name') this.error('Expected an identifier'); return t.text; }
    expr(min = 0) {
        let value, t = this.take();
        if (t.kind === 'number') {
            if (!isInt32(t.text)) this.error(`Number ${t.text} exceeds the signed integer subset`);
            value = {text: t.text, type: 'number', constant: Number(t.text)};
        } else if (t.kind === 'string') value = {text: t.text, type: 'string'};
        else if (t.text === '(') { value = this.expr(); this.take(')'); }
        else if (t.text === '-' || t.text === '~' || t.text === 'not') {
            const arg = this.expr(t.text === 'not' ? 3 : 9);
            if (arg.type === 'string') this.error('Text in an arithmetic/boolean expression');
            value = {text: t.text === '-' ? `(0 - ${arg.text})` : t.text === '~' ? `(bitnot ${arg.text})` : `(not ${arg.text})`, type: t.text === 'not' ? 'condition' : 'number',
                ...(t.text === '-' && arg.constant !== undefined ? {constant: -arg.constant} : {})};
        } else if (t.kind === 'name') {
            if (this.peek('(')) value = this.expressionCall(t.text, this.args());
            else {
                const v = this.vars.get(t.text);
                if (!v) this.error(`Undeclared variable ${t.text}`);
                value = {text: /\s/.test(v.name) ? `(${v.name})` : v.name, type: v.type};
            }
        } else this.error(`Unsupported expression ${t.text}`);
        while ((PRECEDENCE[this.peek().text] || 0) > min) {
            const op = this.take().text, right = this.expr(PRECEDENCE[op]);
            if (value.type === 'string' || right.type === 'string') this.error('String comparison/concatenation needs an explicit Cowgol string runtime');
            if (op === '/' || op === '%') this.error(`Cowgol ${op} uses integer quotient/remainder; the pseudocode operators differ`);
            const condition = PRECEDENCE[op] <= 3;
            value = {text: `(${value.text} ${PSEUDO_OP[op] || op} ${right.text})`, type: condition ? 'condition' : 'number'};
        }
        if (this.peek('as')) this.error('Explicit casts and narrowing are not losslessly representable in pseudocode');
        return value;
    }
    args() {
        this.take('('); const args = [];
        if (!this.peek(')')) { do { args.push(this.expr()); if (!this.peek(',')) break; this.take(','); } while (true); }
        this.take(')'); return args;
    }
    count(name, args, count) { if (args.length !== count) this.error(`${name} expects ${count} arguments`); }
    pin(arg) {
        if (arg.constant === undefined || !this.pins.has(arg.constant)) this.error('Pin calls require a declared, constant mapped pin ID');
        return this.pins.get(arg.constant);
    }
    expressionCall(name, a) {
        const constants = {bw_x: 'x position', bw_y: 'y position', bw_direction: 'direction'};
        if (constants[name]) { this.count(name, a, 0); return {text: constants[name], type: 'number'}; }
        if (name === 'bw_digital_read') {
            this.count(name, a, 1); const p = this.pin(a[0]);
            const read = `(read ${p.name})`;
            return {text: p.activeLow ? `(1 - ${read})` : read, type: 'number'};
        }
        this.error(`Unsupported expression call ${name}`);
    }
    metadata() {
        const token = this.take(), match = /^(@bw-[\w-]+)\s+(.+)$/.exec(token.text);
        if (!match) this.error('Malformed Brickwright metadata');
        let data; try { data = JSON.parse(match[2]); } catch { this.error('Malformed Brickwright metadata JSON'); }
        if (match[1] === '@bw-target') {
            if (!data || typeof data.name !== 'string' || /[\r\n]/.test(data.name) || (data.shape !== null && typeof data.shape !== 'string')) this.error('Invalid target metadata');
            this.target = data;
        } else if (match[1] === '@bw-variable') {
            if (!data || !IDENT.test(data.id) || typeof data.name !== 'string' || /[\r\n]/.test(data.name) || !['global', 'local'].includes(data.scope)) this.error('Invalid variable metadata');
            this.aliases.set(data.id, data);
        } else if (match[1] === '@bw-declaration') {
            if (typeof data !== 'string' || /[\r\n]/.test(data)) this.error('Invalid declaration metadata');
            let m;
            if ((m = /^DEVICE ([\w-]+)$/i.exec(data))) this.device = m[1];
            else if ((m = /^PIN (\w+) = ([\w.]+) (INPUT|OUTPUT)( ACTIVE LOW)?$/i.exec(data))) {
                const id = cowgolPinId(this.device, m[2]);
                if (id === null || this.pins.has(id)) this.error('Unmapped or aliased pin declaration');
                this.pins.set(id, {name: m[1], direction: m[3].toLowerCase(), activeLow: !!m[4]});
            } else this.error('Unsupported declaration metadata');
            this.declarations.push(data);
        } else this.error(`Unknown metadata ${match[1]}`);
    }
    type() {
        if (this.peek('[')) { this.take('['); this.take('uint8'); this.take(']'); return 'string'; }
        const type = this.name();
        if (type !== 'int32') this.error(`Type ${type} has different width/range semantics; use int32 in the convertible subset`);
        return 'number';
    }
    line(out, text, depth) { out.push('  '.repeat(depth) + text); }
    statements(out, depth, stop = []) {
        while (this.peek().kind !== 'eof' && !stop.includes(this.peek().text)) this.statement(out, depth);
    }
    statement(out, depth) {
        if (this.peek().kind === 'meta') { this.metadata(); return; }
        const keyword = this.peek().text;
        this.stats.mapped++;
        if (keyword === 'include') {
            this.take(); const path = this.take();
            if (path.kind !== 'string' || !['"cowgol.coh"', '"brickwright.coh"'].includes(path.text)) this.error('Only the standard and Brickwright host headers have qualified semantics');
            this.take(';'); return;
        }
        if (keyword === 'var') {
            this.take(); const id = this.name(); let type = null;
            if (this.peek(':')) { this.take(':'); type = this.type(); }
            let value = {text: type === 'string' ? '""' : '0', type: type || 'number', constant: 0};
            if (this.peek(':=')) { this.take(':='); value = this.expr(); }
            this.take(';');
            type = type || value.type;
            if (type !== value.type) this.error(`Variable ${id} changes type`);
            if (this.vars.has(id)) this.error(`Variable shadowing/redefinition ${id} is not supported`);
            const alias = this.aliases.get(id), name = alias?.name || id;
            this.vars.set(id, {name, type});
            if (depth === 0 && out === this.main && out.length === 0) {
                (alias?.scope === 'local' ? this.locals : this.globals).push(`${alias?.scope === 'local' ? 'LOCAL' : 'GLOBAL'} ${name} = ${value.text}`);
            } else this.line(out, `set ${name} to ${value.text}`, depth);
            return;
        }
        if (keyword === 'if') {
            this.take(); const c = this.expr(); this.take('then');
            if (c.type === 'string') this.error('Text cannot be a Cowgol condition');
            this.line(out, `IF ${c.type === 'condition' ? c.text : `(${c.text} != 0)`} THEN:`, depth);
            const bodyAt = out.length; this.statements(out, depth + 1, ['else', 'elseif', 'end']);
            if (out.length === bodyAt) this.line(out, 'PASS:', depth + 1);
            let elseDepth = depth;
            while (this.peek('elseif')) {
                this.take(); const condition = this.expr(); this.take('then');
                this.line(out, 'ELSE:', elseDepth); elseDepth++;
                this.line(out, `IF ${condition.text} THEN:`, elseDepth); this.statements(out, elseDepth + 1, ['else', 'elseif', 'end']);
            }
            if (this.peek('else')) { this.take(); this.line(out, 'ELSE:', elseDepth); const at = out.length; this.statements(out, elseDepth + 1, ['end']); if (out.length === at) this.line(out, 'PASS:', elseDepth + 1); }
            this.take('end'); this.take('if'); this.take(';'); return;
        }
        if (keyword === 'while' || keyword === 'loop') {
            this.take();
            if (keyword === 'while') { const c = this.expr(); this.take('loop'); this.line(out, `REPEAT UNTIL (not ${c.text}):`, depth); }
            else this.line(out, 'FOREVER:', depth);
            this.statements(out, depth + 1, ['end']); this.take('end'); this.take('loop'); this.take(';'); return;
        }
        if (keyword === 'sub') {
            if (depth || out !== this.main) this.error('Nested procedures are not supported');
            this.take(); const name = this.name(); this.take('('); const params = [];
            if (!this.peek(')')) do {
                const id = this.name(); this.take(':'); const type = this.type();
                if (this.vars.has(id)) this.error(`Parameter shadowing ${id} is not supported`);
                this.vars.set(id, {name: id, type}); params.push(id);
                if (!this.peek(',')) break; this.take(',');
            } while (true);
            this.take(')'); this.take('is'); this.procs.set(name, params.length);
            this.definitions.push(`DEFINE ${name}${params.map(p => ` (${p})`).join('')}:`);
            this.statements(this.definitions, 1, ['end']); this.take('end'); this.take('sub'); this.take(';');
            for (const p of params) this.vars.delete(p);
            return;
        }
        const name = this.name();
        if (this.peek(':=')) {
            this.take(); const v = this.vars.get(name); if (!v) this.error(`Assignment to undeclared ${name}`);
            const rhs = this.expr(); this.take(';'); if (rhs.type !== v.type) this.error(`Assignment changes type of ${name}`);
            this.line(out, `set ${v.name} to ${rhs.text}`, depth); return;
        }
        const a = this.args(); this.take(';'); this.call(out, depth, name, a);
    }
    call(out, depth, name, args) {
        const a = args.map(v => v.text), line = text => this.line(out, text, depth);
        const simple = {
            bw_go_to: [2, () => `go to x: ${a[0]} y: ${a[1]}`], bw_move: [1, () => `move ${a[0]} steps`],
            bw_turn: [1, () => `turn right ${a[0]} degrees`], bw_point_direction: [1, () => `point in direction ${a[0]}`],
            bw_pen_down: [0, () => 'pen down'], bw_pen_up: [0, () => 'pen up'],
            bw_pen_size: [1, () => `set pen size to ${a[0]}`],
            bw_print_text: [1, () => `say ${a[0]}`], bw_print_number: [1, () => `say ${a[0]}`],
            Exit: [0, () => 'stop all']
        };
        if (simple[name]) {
            this.count(name, args, simple[name][0]);
            if (name === 'bw_print_text' ? args[0]?.type !== 'string' : args.some(v => v.type !== 'number')) this.error(`Wrong argument type for ${name}`);
            line(simple[name][1]()); return;
        }
        if (name === 'bw_pen_colour') {
            this.count(name, args, 1); const n = args[0].constant;
            if (!Number.isInteger(n) || n < 0 || n > 0xffffff) this.error('Pen colour requires a constant RGB24 value');
            line(`set pen color to #${n.toString(16).padStart(6, '0')}`); return;
        }
        if (name === 'bw_canvas_clear') {
            this.count(name, args, 1); if (args[0].constant !== 0) this.error('Only transparent/zero canvas clear maps to Scratch pen clear');
            line('clear'); return;
        }
        if (name === 'bw_delay') {
            this.count(name, args, 1);
            if (args[0].type !== 'number' || (args[0].constant !== undefined && args[0].constant < 0)) this.error('Delay must be nonnegative milliseconds');
            line(`wait ${args[0].constant !== undefined ? args[0].constant / 1000 : `(${a[0]} / 1000)`} seconds`); return;
        }
        if (name === 'bw_pin_mode') {
            this.count(name, args, 2); const p = this.pin(args[0]);
            const expected = p.direction === 'output' ? 1 : p.activeLow ? 2 : 0;
            if (args[1].constant !== expected) this.error('Runtime pin-mode changes cannot replace a static PIN declaration');
            return;
        }
        if (name === 'bw_digital_write' || name === 'bw_digital_toggle') {
            this.count(name, args, name === 'bw_digital_write' ? 2 : 1); const p = this.pin(args[0]);
            if (p.direction !== 'output') this.error(`Write to input ${p.name}`);
            if (name === 'bw_digital_toggle') line(`toggle ${p.name}`);
            else if (args[1].constant === 0 || args[1].constant === 1) line(`set ${p.name} ${args[1].constant ? 'high' : 'low'}`);
            else this.error('Digital writes require electrical 0/1; normalize with an if statement');
            return;
        }
        if (this.procs.has(name)) {
            this.count(name, args, this.procs.get(name)); line(`call ${name}${a.map(v => ` ${v}`).join('')}`); return;
        }
        this.error(`Unsupported statement call ${name}`);
    }
    run() {
        this.statements(this.main, 0);
        const head = [...this.declarations, ...this.globals];
        const target = this.target.isStage ? 'STAGE:' : `SPRITE ${this.target.name}:`;
        head.push('', target);
        if (this.target.shape) head.push(`  SHAPE ${this.target.shape}`);
        head.push(...this.locals.map(l => `  ${l}`));
        head.push(...this.definitions.map(l => `  ${l}`));
        head.push('  WHEN flag clicked:', ...this.main.map(l => `    ${l}`));
        if (!this.main.length) head.push('    PASS:');
        return head.join('\n') + '\n';
    }
}

export function cowgolToPseudocode(source, opts = {}) {
    const text = String(source ?? '');
    try {
        const reader = new Reader(text, opts), pseudocode = reader.run();
        return {ok: true, pseudocode, warnings: [], reasons: [], diagnostics: [], stats: reader.stats};
    } catch (error) {
        const message = String(error.message || error);
        return {ok: false, pseudocode: '', preview: text.split('\n').map(l => `# Cowgol: ${l}`).join('\n'),
            warnings: [], reasons: [message], diagnostics: [diagnostic(message)], stats: {lines: text.split(/\r?\n/).length, mapped: 0}};
    }
}
