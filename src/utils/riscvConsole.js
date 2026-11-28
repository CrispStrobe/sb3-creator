import {generateCowgol} from './cowgol.js';

/* The RV32 bench currently implements console write/exit, not a GPIO or a
 * display device. This is a deliberately small executable C backend for that
 * machine. The Cowgol checker supplies the shared sequential/int32 contract;
 * this emitter additionally refuses every operation without a console runtime.
 * No source text is evaluated or rewritten into C. */

const quote = value => JSON.stringify(String(value)).replace(/\?/g, '\\?');
const integer = value => Number(value) === -2147483648 ? 'INT32_MIN' : `INT32_C(${Number(value)})`;

export function generateRiscvC(creator, project = creator.project, opts = {}) {
    const checked = generateCowgol(creator, project);
    const diagnostics = checked.diagnostics.map(d => ({...d, code: 'riscv-console-unsupported'}));
    const warnings = [
        'RISC-V console C requires the hosted riscv32-gcc target. The browser shecc subset is not this backend.',
        'Integer arithmetic is checked signed int32; an out-of-range intermediate exits with an error.'
    ];
    const fail = (message, blockId = null, opcode = null) => diagnostics.push({
        severity: 'error', code: 'riscv-console-unsupported', message, blockId, opcode
    });
    const result = (c, lineMap = {}) => ({ok: diagnostics.length === 0,
        ...(diagnostics.length ? {} : {c}), reasons: diagnostics.map(d => d.message),
        diagnostics, warnings, lineMap, target: 'riscv32-gcc', profile: 'int32-console'});
    if (opts.profile !== undefined && opts.profile !== 'int32-console') fail(`Unknown RISC-V console profile ${opts.profile}`);
    const stc = project.stc || creator.constructor.readStc?.(project) || {};
    if ((stc.pins || []).length || Object.keys(stc.ports || {}).length
        || Object.keys(stc.parts || {}).length || stc.ledcube || stc.machine) {
        fail('RISC-V console has no GPIO, ports, peripherals, or circuit memory map');
    }
    if ((stc.tables || []).length) fail('RISC-V console C does not implement declared lookup tables');
    if (diagnostics.length) return result();

    const targets = project.targets || [];
    let active, entry;
    for (const target of targets) for (const b of Object.values(target.blocks || {})) {
        if (b.topLevel && b.opcode === 'event_whenflagclicked') { active = target; entry = b; }
    }
    // The shared checker has already required exactly one flag script.
    const blocks = active.blocks || {};
    const variables = new Map(), names = new Map();
    const stateTargets = [targets.find(t => t.isStage), ...(active.isStage ? [] : [active])].filter(Boolean);
    for (const target of stateTargets) for (const [id, [name, initial]] of Object.entries(target.variables || {})) {
        const v = {id: `bw_v${variables.size}`, initial, type: typeof initial === 'string' ? 'string' : 'number'};
        variables.set(id, v); names.set(name, v);
    }
    const variable = field => variables.get(field?.[1]) || names.get(field?.[0]);
    for (const b of Object.values(blocks)) if (b.opcode === 'data_setvariableto') {
        const v = variable(b.fields.VARIABLE);
        if (v && Array.isArray(b.inputs.VALUE?.[1]) && b.inputs.VALUE[1][0] === 10) v.type = 'string';
    }
    const helpers = new Set();
    const value = (input, ownerId) => {
        const raw = input?.[1];
        if (Array.isArray(raw)) {
            if (raw[0] === 12) {
                const v = variables.get(raw[2]) || names.get(raw[1]);
                return {code: v.id, type: v.type};
            }
            if (raw[0] === 10) return {code: quote(raw[1]), type: 'string'};
            if (raw[0] === 9) return {code: integer(parseInt(raw[1].slice(1), 16)), type: 'number'};
            return {code: integer(raw[1]), type: 'number'};
        }
        const b = blocks[raw];
        if (!b) { fail('Missing RISC-V console expression', ownerId); return {code: '0', type: 'number'}; }
        const n = key => value(b.inputs?.[key], raw).code;
        const arithmetic = {operator_add: 'add', operator_subtract: 'sub', operator_multiply: 'mul'};
        if (arithmetic[b.opcode]) {
            const op = arithmetic[b.opcode]; helpers.add(op);
            return {code: `bw_rv_${op}(${n('NUM1')}, ${n('NUM2')})`, type: 'number'};
        }
        const bitwise = {bitops_and: '&', bitops_or: '|', bitops_xor: '^'};
        if (bitwise[b.opcode]) {
            helpers.add('bits');
            return {code: `bw_rv_bits((uint32_t)(${n('NUM1')}) ${bitwise[b.opcode]} (uint32_t)(${n('NUM2')}))`, type: 'number'};
        }
        fail(`Reporter ${b.opcode} has no RISC-V console implementation`, raw, b.opcode);
        return {code: '0', type: 'number'};
    };
    const condition = (input, ownerId) => {
        const b = blocks[input?.[1]];
        if (!b) return `(${value(input, ownerId).code} != 0)`;
        const comparison = {operator_equals: '==', operator_lt: '<', operator_gt: '>'};
        if (comparison[b.opcode]) return `(${value(b.inputs.OPERAND1, input[1]).code} ${comparison[b.opcode]} ${value(b.inputs.OPERAND2, input[1]).code})`;
        if (b.opcode === 'operator_and' || b.opcode === 'operator_or') {
            return `(${condition(b.inputs.OPERAND1, input[1])} ${b.opcode === 'operator_and' ? '&&' : '||'} ${condition(b.inputs.OPERAND2, input[1])})`;
        }
        if (b.opcode === 'operator_not') return `(!${condition(b.inputs.OPERAND, input[1])})`;
        return `(${value(input, ownerId).code} != 0)`;
    };
    const body = [], relativeMap = {};
    const emit = (line, depth, id) => { if (id) relativeMap[body.length] = id; body.push('    '.repeat(depth) + line); };
    let nextLoop = 0;
    const chain = (first, depth) => {
        let id = first;
        const seen = new Set();
        while (id) {
            if (seen.has(id) || !blocks[id]) { fail('Malformed or cyclic RISC-V console stack', id); break; }
            seen.add(id);
            const b = blocks[id], line = text => emit(text, depth, id);
            switch (b.opcode) {
            case 'data_setvariableto': case 'data_changevariableby': {
                const v = variable(b.fields.VARIABLE), rhs = value(b.inputs.VALUE, id).code;
                if (b.opcode === 'data_changevariableby') { helpers.add('add'); line(`${v.id} = bw_rv_add(${v.id}, ${rhs});`); }
                else line(`${v.id} = ${rhs};`);
                break;
            }
            case 'looks_say': case 'stc12_print': {
                const v = value(b.inputs[b.opcode === 'looks_say' ? 'MESSAGE' : 'VALUE'], id);
                line(v.type === 'string' ? `puts(${v.code});` : `printf("%ld\\n", (long)(${v.code}));`);
                break;
            }
            case 'control_if': case 'control_if_else':
                line(`if (${condition(b.inputs.CONDITION, id)}) {`);
                chain(b.inputs.SUBSTACK?.[1], depth + 1);
                if (b.opcode === 'control_if_else') { line('} else {'); chain(b.inputs.SUBSTACK2?.[1], depth + 1); }
                line('}'); break;
            case 'control_repeat': {
                const counter = `bw_repeat${nextLoop++}`;
                line(`int32_t ${counter} = ${value(b.inputs.TIMES, id).code};`);
                line(`while (${counter} > 0) {`);
                chain(b.inputs.SUBSTACK?.[1], depth + 1);
                emit(`--${counter};`, depth + 1, id); line('}'); break;
            }
            case 'control_repeat_until':
                line(`while (!${condition(b.inputs.CONDITION, id)}) {`);
                chain(b.inputs.SUBSTACK?.[1], depth + 1); line('}'); break;
            case 'control_forever':
                line('for (;;) {'); chain(b.inputs.SUBSTACK?.[1], depth + 1); line('}'); break;
            case 'control_stop': line('return 0;'); break;
            case 'control_wait':
                fail('RISC-V console has no qualified timer; wait is unsupported', id, b.opcode); break;
            default:
                fail(`Statement ${b.opcode} has no RISC-V console implementation`, id, b.opcode);
            }
            id = b.next;
        }
    };
    chain(entry.next, 1);
    if (diagnostics.length) return result();

    const out = ['/* Generated by Brickwright: checked int32 RISC-V console C.',
        ' * Compile for riscv32-gcc (RV32IMAC + the console write/exit runtime).',
        ' * No GPIO, canvas, timer, or scheduler runtime is implied. */',
        '#include <stdint.h>', '#include <stdio.h>', '#include <stdlib.h>', ''];
    if (['add', 'sub', 'mul'].some(name => helpers.has(name))) {
        out.push('static int32_t bw_rv_checked(int64_t value) {',
            '    if (value < INT32_MIN || value > INT32_MAX) {',
            '        fputs("RISC-V console: signed int32 overflow\\n", stderr);',
            '        exit(1);', '    }', '    return (int32_t)value;', '}');
        for (const [name, op] of [['add', '+'], ['sub', '-'], ['mul', '*']]) if (helpers.has(name)) {
            out.push(`static int32_t bw_rv_${name}(int32_t a, int32_t b) {`,
                `    return bw_rv_checked((int64_t)a ${op} (int64_t)b);`, '}');
        }
    }
    if (helpers.has('bits')) out.push('static int32_t bw_rv_bits(uint32_t value) {',
        '    return (value & UINT32_C(2147483648)) ? -(int32_t)(~value) - 1 : (int32_t)value;', '}');
    out.push('', 'int main(void) {');
    for (const v of variables.values()) {
        out.push(`    ${v.type === 'string' ? 'const char *' : 'int32_t '}${v.id} = ${v.type === 'string' ? quote(v.initial ?? '') : integer(v.initial || 0)};`);
        // Variables may be meaningful saved state even if this script never reads them.
        out.push(`    (void)${v.id};`);
    }
    const lineMap = Object.fromEntries(Object.entries(relativeMap).map(([line, id]) => [out.length + Number(line) + 1, id]));
    out.push(...body, '    return 0;', '}', '');
    return result(out.join('\n'), lineMap);
}
