/**
 * Original assembler for the documented Kosmos CP1 teaching language.
 *
 * This module translates text into the CP1's two-byte RAM cells. It does not
 * execute those cells: execution belongs to the 8049 and the user's ROM.
 * A decimal cell such as 04.001 is two integers, never a floating-point value.
 * See reference/cp1-program-format.md for syntax and authorship notes.
 */

export const CP1_MNEMONICS = Object.freeze([
    'DATA', 'HLT', 'ANZ', 'VZG', 'AKO', 'LDA', 'ABS', 'ADD', 'SUB',
    'SPU', 'VGL', 'SPB', 'VGR', 'VKL', 'NEG', 'UND', 'P1E', 'P1A',
    'P2A', 'LIA', 'AIS', 'SIU', 'P3E', 'P4A', 'P5A'
]);

const OPCODES = new Map(CP1_MNEMONICS.map((name, opcode) => [name, opcode]));
const ADDRESS_OPCODES = new Set([5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 19, 20, 21]);
const NO_OPERAND_OPCODES = new Set([1, 2, 14]);
const PORT_OPCODES = new Set([16, 17, 18, 22, 23, 24]);
const MAX_SOURCE_LENGTH = 256 * 1024;
const MAX_SOURCE_LINES = 8192;

const diagnostic = (code, line, column, message) => ({severity: 'error', code, line, column, message});

/**
 * Assemble source without throwing for source errors.
 *
 * Result.bytes is null when any diagnostic exists; callers cannot accidentally
 * run a partial program. Result.sourceMap is indexed by RAM cell address.
 * Options.expansion enables 256 cells; the base machine has 128 cells.
 */
export function parseCp1Program (source, {expansion = false} = {}) {
    if (typeof expansion !== 'boolean') throw new TypeError('expansion must be a boolean');
    const capacity = expansion ? 256 : 128;
    const diagnostics = [];
    const words = [];
    const sourceMap = Array(capacity).fill(null);
    const symbols = Object.create(null);
    const definitions = new Map();
    const statements = [];
    const seenDiagnostics = new Set();
    const addError = (code, line, column, message) => {
        const key = `${code}:${line}:${column}:${message}`;
        if (!seenDiagnostics.has(key)) {
            diagnostics.push(diagnostic(code, line, column, message));
            seenDiagnostics.add(key);
        }
    };
    const finish = bytes => ({
        ok: diagnostics.length === 0, capacity, expansion, bytes, words, sourceMap,
        symbols: {...symbols}, diagnostics: diagnostics.sort((a, b) => a.line - b.line || a.column - b.column),
        usedCells: words.length, entry: words.length ? words[0].address : 0
    });
    if (typeof source !== 'string') {
        addError('source-type', 1, 1, 'CP1 source must be text.');
        return finish(null);
    }
    if (source.length > MAX_SOURCE_LENGTH) {
        addError('source-size', 1, 1, `CP1 source exceeds ${MAX_SOURCE_LENGTH} characters.`);
        return finish(null);
    }
    const lines = source.replace(/^\uFEFF/, '').split(/\r\n?|\n/);
    if (lines.length > MAX_SOURCE_LINES) {
        addError('source-lines', MAX_SOURCE_LINES + 1, 1, `CP1 source exceeds ${MAX_SOURCE_LINES} lines.`);
        return finish(null);
    }
    const define = (name, entry) => {
        const key = name.toUpperCase();
        if (OPCODES.has(key) || ['DB', 'ORG', 'EQU'].includes(key)) {
            addError('reserved-symbol', entry.line, entry.column, `${name} is a reserved command name.`);
            return;
        }
        if (definitions.has(key)) {
            addError('duplicate-symbol', entry.line, entry.column,
                `${name} was already defined on line ${definitions.get(key).line}.`);
            return;
        }
        definitions.set(key, entry);
        return key;
    };

    // Parse statements before laying them out, so EQU constants may be forward
    // references. Locations are resolved in a separate pass; ORG cannot depend
    // on a label whose location itself has not been determined yet.
    for (let index = 0; index < lines.length; index++) {
        const original = lines[index];
        const raw = original.replace(/(?:;|#|\/\/).*$/, '');
        let text = raw.trim();
        if (!text) continue;
        const line = index + 1;
        const column = raw.search(/\S/) + 1;
        const statement = {line, column, original, label: null, address: null};
        const equ = text.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s*:\s*|\s+)EQU\s+(.+)$/i);
        if (equ) {
            define(equ[1], {kind: 'equ', expression: equ[2], line, column});
            continue;
        }
        const prefix = text.match(/^(\d+)\s*:\s*(.*)$/) ||
            text.match(/^(\d+)\s+(?=\d{1,3}\.\d{1,3}(?:\s|$))(.+)$/);
        if (prefix) {
            statement.explicitAddress = Number(prefix[1]);
            text = prefix[2].trim();
        } else {
            const label = text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
            if (label) {
                statement.label = define(label[1], {kind: 'label', statement, line, column});
                text = label[2].trim();
            }
        }
        if (!text) {
            statement.kind = 'label';
            statements.push(statement);
            continue;
        }
        const numeric = text.match(/^(\d{1,3})\.(\d{1,3})$/);
        if (numeric) {
            Object.assign(statement, {kind: 'cell', opcode: Number(numeric[1]), operands: [numeric[2]]});
            statements.push(statement);
            continue;
        }
        const command = text.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s+(.*))?$/);
        if (!command) {
            addError('syntax', line, column, 'Expected a mnemonic or an opcode.operand cell such as 04.001.');
            continue;
        }
        const name = command[1].toUpperCase();
        const operand = (command[2] || '').trim();
        if (name === 'ORG') {
            Object.assign(statement, {kind: 'org', expression: operand});
        } else if (name === 'DATA' || name === 'DB') {
            Object.assign(statement, {kind: 'cell', opcode: 0, operands: operand.split(',').map(s => s.trim())});
        } else if (OPCODES.has(name)) {
            const opcode = OPCODES.get(name);
            Object.assign(statement, {kind: 'cell', opcode,
                operands: [operand || (NO_OPERAND_OPCODES.has(opcode) ? '0' : '')]});
        } else {
            addError('unknown-command', line, column, `Unknown CP1 command ${command[1]}.`);
            continue;
        }
        statements.push(statement);
    }

    const evaluate = (expression, statement, visiting = new Set()) => {
        const expressionText = expression.trim();
        if (!expressionText) {
            addError('missing-operand', statement.line, statement.column, 'This command requires an operand.');
            return null;
        }
        // Deliberately bounded expression grammar: decimal integers and symbols,
        // joined with + or -. No eval, floats, coercion, or executable text.
        if (!/^[+-]?\s*(?:\d+|[A-Za-z_][A-Za-z0-9_]*)(?:\s*[+-]\s*(?:\d+|[A-Za-z_][A-Za-z0-9_]*))*$/.test(expressionText)) {
            addError('expression', statement.line, statement.column, `Invalid decimal expression: ${expression}.`);
            return null;
        }
        const text = expressionText.replace(/\s+/g, '');
        let result = 0;
        for (const token of text.match(/[+-]?(?:\d+|[A-Za-z_][A-Za-z0-9_]*)/g)) {
            const sign = token[0] === '-' ? -1 : 1;
            const term = /^[+-]/.test(token) ? token.slice(1) : token;
            let value;
            if (/^\d+$/.test(term)) value = Number(term);
            else {
                const name = term.toUpperCase();
                const entry = definitions.get(name);
                if (!entry) {
                    addError('unknown-symbol', statement.line, statement.column, `Unknown symbol ${term}.`);
                    return null;
                }
                if (visiting.has(name)) {
                    addError('cyclic-symbol', statement.line, statement.column, `Cyclic EQU definition involving ${term}.`);
                    return null;
                }
                if (visiting.size >= 128) {
                    addError('symbol-depth', statement.line, statement.column, 'EQU definitions nest more than 128 levels.');
                    return null;
                }
                if (entry.kind === 'label') {
                    value = entry.statement.address;
                    if (value === null) {
                        addError('unresolved-origin', statement.line, statement.column,
                            `ORG cannot depend on the unresolved label ${term}.`);
                        return null;
                    }
                } else {
                    const next = new Set(visiting);
                    next.add(name);
                    value = evaluate(entry.expression, entry, next);
                    if (value === null) return null;
                }
            }
            result += sign * value;
            if (!Number.isSafeInteger(result)) {
                addError('integer-range', statement.line, statement.column, 'Expression is outside the safe integer range.');
                return null;
            }
        }
        return result;
    };

    let nextAddress = 0;
    for (const statement of statements) {
        if (statement.explicitAddress !== undefined) nextAddress = statement.explicitAddress;
        statement.address = nextAddress;
        if (statement.kind === 'org') {
            const origin = evaluate(statement.expression, statement);
            if (origin !== null) {
                if (origin < 0 || origin >= capacity) {
                    addError('address-range', statement.line, statement.column,
                        `ORG must be between 0 and ${capacity - 1}${expansion ? '' : ' (enable CP3 for 128–255)'}.`);
                } else {
                    nextAddress = origin;
                    statement.address = origin;
                }
            }
        } else if (statement.kind === 'cell') nextAddress += statement.operands.length;
        if (statement.label && (statement.address < 0 || statement.address >= capacity)) {
            addError('address-range', statement.line, statement.column,
                `Label address must be between 0 and ${capacity - 1}.`);
        }
    }
    for (const [name, entry] of definitions) {
        const value = entry.kind === 'label' ? entry.statement.address : evaluate(entry.expression, entry, new Set([name]));
        if (value !== null) symbols[name] = value;
    }

    const occupied = new Map();
    const bytes = new Uint8Array(capacity * 2);
    for (const statement of statements) {
        if (statement.kind !== 'cell') continue;
        const opcode = statement.opcode;
        if (!Number.isInteger(opcode) || opcode < 0 || opcode > 24) {
            addError('opcode-range', statement.line, statement.column, 'A CP1 opcode must be between 00 and 24.');
        }
        for (let index = 0; index < statement.operands.length; index++) {
            const address = statement.address + index;
            const operand = evaluate(statement.operands[index], statement);
            if (!Number.isSafeInteger(address) || address < 0 || address >= capacity) {
                addError('address-range', statement.line, statement.column,
                    `Cell address ${address} is outside 0–${capacity - 1}${expansion ? '' : '; enable CP3 for 128–255'}.`);
                continue;
            }
            if (occupied.has(address)) {
                addError('duplicate-address', statement.line, statement.column,
                    `Cell ${address} was already written on line ${occupied.get(address)}.`);
                continue;
            }
            occupied.set(address, statement.line);
            if (operand === null) continue;
            let maxOperand = 255;
            if (ADDRESS_OPCODES.has(opcode)) maxOperand = capacity - 1;
            if (PORT_OPCODES.has(opcode)) maxOperand = opcode === 24 ? 6 : 8;
            if (NO_OPERAND_OPCODES.has(opcode)) maxOperand = 0;
            if (operand < 0 || operand > maxOperand) {
                addError('operand-range', statement.line, statement.column,
                    `${CP1_MNEMONICS[opcode] || 'Cell'} operand must be between 0 and ${maxOperand}.`);
                continue;
            }
            if (opcode >= 22 && !expansion) {
                addError('expansion-required', statement.line, statement.column,
                    `${CP1_MNEMONICS[opcode]} needs the CP3 expansion.`);
                continue;
            }
            if (opcode > 24) continue;
            const word = {address, opcode, operand, line: statement.line, column: statement.column};
            words.push(word);
            sourceMap[address] = {...word, source: statement.original};
            bytes[address * 2] = opcode;
            bytes[address * 2 + 1] = operand;
        }
    }
    words.sort((a, b) => a.address - b.address);
    return finish(diagnostics.length ? null : bytes);
}

/** Throwing convenience for callers whose load transaction already catches errors. */
export function assembleCp1Program (source, options) {
    const result = parseCp1Program(source, options);
    if (!result.ok) {
        const error = new SyntaxError(result.diagnostics.map(d => `Line ${d.line}: ${d.message}`).join('\n'));
        error.diagnostics = result.diagnostics;
        throw error;
    }
    return result;
}

/**
 * Export a successful assembly (only occupied cells) or a complete byte image
 * (all cells) as an exact, reparsable decimal listing. Output always has a
 * trailing newline. Byte images are opcode first, operand second.
 */
export function exportCp1Program (program, {addresses = true} = {}) {
    let words;
    if (program instanceof Uint8Array) {
        if (![256, 512].includes(program.length)) throw new RangeError('A CP1 image is 256 or 512 bytes.');
        words = Array.from({length: program.length / 2}, (_, address) => ({
            address, opcode: program[address * 2], operand: program[address * 2 + 1]
        }));
    } else if (program && program.ok === true && Array.isArray(program.words)) words = program.words;
    else throw new TypeError('Export requires a successful CP1 assembly or a Uint8Array image.');
    const result = [];
    for (const word of words) {
        for (const field of ['address', 'opcode', 'operand']) {
            if (!Number.isInteger(word[field]) || word[field] < 0 || word[field] > 255) {
                throw new RangeError(`Invalid CP1 ${field}.`);
            }
        }
        if (word.opcode > 24) throw new RangeError('A CP1 source listing only supports opcodes 00–24.');
        result.push(`${addresses ? `${String(word.address).padStart(3, '0')}: ` : ''}` +
            `${String(word.opcode).padStart(2, '0')}.${String(word.operand).padStart(3, '0')}`);
    }
    return result.length ? `${result.join('\n')}\n` : '';
}

