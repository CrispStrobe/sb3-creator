// SPDX-License-Identifier: BSD-3-Clause
/**
 * Original CARDIAC source assembler and decimal input-strip utilities.
 *
 * This module only describes memory and input data. Execution, the immutable
 * word at 00, decimal arithmetic, and the input/output devices belong to the
 * machine. No historical program, artwork, or emulator implementation is used.
 */

export const CARDIAC_MNEMONICS = Object.freeze([
    'INP', 'CLA', 'ADD', 'TAC', 'SFT', 'OUT', 'STO', 'SUB', 'JMP', 'HRS'
]);

export const CARDIAC_SOURCE_LIMITS = Object.freeze({
    characters: 65536, lines: 4096, deckValues: 10000
});

const opcodes = new Map(CARDIAC_MNEMONICS.map((name, opcode) => [name, opcode]));
const reserved = new Set([...CARDIAC_MNEMONICS, 'DAT', 'ORG', 'ENTRY']);
const inRange = (value, minimum, maximum) => Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const commentless = text => text.replace(/(?:;|#|\/\/).*$/, '');
const normalZero = value => value === 0 ? 0 : value;
const issue = (severity, code, line, column, message) => ({severity, code, line, column, message});

export function formatCardiacWord (value) {
    if (!inRange(value, -999, 999)) throw new RangeError('A CARDIAC memory/input word must be an integer from -999 to 999.');
    return `${value < 0 ? '-' : ''}${String(Math.abs(value)).padStart(3, '0')}`;
}

/**
 * Assemble without throwing for source errors. Origins, labels and operands
 * use decimal cell addresses, never byte addresses. The default origin is 01.
 *
 * Error results contain no runnable partial words or listing. Warnings do not
 * suppress a successful assembly. Empty/data-only sources have entry:null
 * unless an ENTRY directive selects an address explicitly.
 */
export function assembleCardiac (source) {
    const diagnostics = [];
    const statements = [];
    const definitions = new Map();
    const symbols = Object.create(null);
    const words = [];
    const listing = [];
    let entry = null;
    let entryStatement = null;
    const seenIssues = new Set();
    const report = (severity, code, statement, message) => {
        const line = statement?.line || 1;
        const column = statement?.column || 1;
        const key = `${severity}:${code}:${line}:${column}:${message}`;
        if (seenIssues.has(key)) return;
        seenIssues.add(key);
        diagnostics.push(issue(severity, code, line, column, message));
    };
    const error = (code, statement, message) => report('error', code, statement, message);
    const warning = (code, statement, message) => report('warning', code, statement, message);
    const finish = () => {
        const ok = !diagnostics.some(item => item.severity === 'error');
        diagnostics.sort((a, b) => a.line - b.line || a.column - b.column || a.code.localeCompare(b.code));
        return {ok, words: ok ? words : [], entry: ok ? entry : null,
            listing: ok ? listing : [], symbols: {...symbols}, diagnostics};
    };

    if (typeof source !== 'string') {
        error('source-type', null, 'CARDIAC source must be text.');
        return finish();
    }
    if (source.length > CARDIAC_SOURCE_LIMITS.characters) {
        error('source-size', null, `CARDIAC source exceeds ${CARDIAC_SOURCE_LIMITS.characters} characters.`);
        return finish();
    }
    const lines = source.replace(/^\uFEFF/, '').split(/\r\n?|\n/);
    if (lines.length > CARDIAC_SOURCE_LIMITS.lines) {
        error('source-lines', {line: CARDIAC_SOURCE_LIMITS.lines + 1, column: 1},
            `CARDIAC source exceeds ${CARDIAC_SOURCE_LIMITS.lines} lines.`);
        return finish();
    }

    for (let index = 0; index < lines.length; index++) {
        const original = lines[index];
        const raw = commentless(original);
        let text = raw.trim();
        if (!text) continue;
        const statement = {line: index + 1, column: raw.search(/\S/) + 1, source: original, address: null};
        const addressed = text.match(/^(\d+)\s*:\s*(.*)$/) || text.match(/^(\d+)\s+([+-]?\d+)$/);
        if (addressed) {
            statement.explicitAddress = Number(addressed[1]);
            text = addressed[2].trim();
        } else {
            const labeled = text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
            if (labeled) {
                const name = labeled[1].toUpperCase();
                if (reserved.has(name)) error('reserved-symbol', statement, `${labeled[1]} is a reserved command name.`);
                else if (definitions.has(name)) {
                    error('duplicate-symbol', statement, `${labeled[1]} was already defined on line ${definitions.get(name).line}.`);
                } else {
                    definitions.set(name, statement);
                    statement.label = name;
                }
                text = labeled[2].trim();
            }
        }
        if (!text) {
            statement.kind = 'label';
            statements.push(statement);
            continue;
        }
        if (/^[+-]?\d+$/.test(text)) {
            Object.assign(statement, {kind: 'word', values: [text], data: text.startsWith('-')});
            statements.push(statement);
            continue;
        }
        const command = text.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\s+(.*))?$/);
        if (!command) {
            error('syntax', statement, 'Expected a mnemonic, DAT value, or decimal word such as 180.');
            continue;
        }
        const name = command[1].toUpperCase();
        const operand = (command[2] || '').trim();
        if (name === 'ORG') Object.assign(statement, {kind: 'org', expression: operand});
        else if (name === 'ENTRY') {
            Object.assign(statement, {kind: 'entry', expression: operand});
            if (entryStatement) error('duplicate-entry', statement, `ENTRY was already specified on line ${entryStatement.line}.`);
            else entryStatement = statement;
        } else if (name === 'DAT') {
            Object.assign(statement, {kind: 'word', values: operand.split(',').map(value => value.trim()), data: true});
        } else if (opcodes.has(name)) {
            Object.assign(statement, {kind: 'instruction', opcode: opcodes.get(name),
                values: [operand || (name === 'HRS' ? '0' : '')]});
        } else {
            error('unknown-command', statement, `Unknown CARDIAC command ${command[1]}.`);
            continue;
        }
        statements.push(statement);
    }

    const evaluate = (expression, statement, layout = false) => {
        if (!expression.trim()) {
            error('missing-operand', statement, 'This command requires an operand.');
            return null;
        }
        // Bounded integer/label grammar. No evaluation of JavaScript, floats,
        // hexadecimal literals, property access, or function calls.
        if (!/^[+-]?\s*(?:\d+|[A-Za-z_][A-Za-z0-9_]*)(?:\s*[+-]\s*(?:\d+|[A-Za-z_][A-Za-z0-9_]*))*$/.test(expression)) {
            error('expression', statement, `Invalid decimal expression: ${expression}.`);
            return null;
        }
        const compact = expression.replace(/\s+/g, '');
        let result = 0;
        for (const token of compact.match(/[+-]?(?:\d+|[A-Za-z_][A-Za-z0-9_]*)/g)) {
            const sign = token[0] === '-' ? -1 : 1;
            const term = /^[+-]/.test(token) ? token.slice(1) : token;
            let value;
            if (/^\d+$/.test(term)) value = Number(term);
            else {
                const definition = definitions.get(term.toUpperCase());
                if (!definition) {
                    error('unknown-symbol', statement, `Unknown label ${term}.`);
                    return null;
                }
                value = definition.address;
                if (value === null) {
                    error(layout ? 'unresolved-origin' : 'unresolved-symbol', statement,
                        `${layout ? 'ORG cannot use' : 'Cannot resolve'} the unresolved label ${term}.`);
                    return null;
                }
            }
            if (!Number.isSafeInteger(value) || !Number.isSafeInteger(result + sign * value)) {
                error('integer-range', statement, 'Expression is outside the safe integer range.');
                return null;
            }
            result += sign * value;
        }
        return normalZero(result);
    };

    let nextAddress = 1;
    for (const statement of statements) {
        if (statement.explicitAddress !== undefined) nextAddress = statement.explicitAddress;
        statement.address = nextAddress;
        if (statement.kind === 'org') {
            const origin = evaluate(statement.expression, statement, true);
            if (origin !== null) {
                if (!inRange(origin, 0, 99)) error('address-range', statement, 'ORG must be between 00 and 99.');
                else statement.address = nextAddress = origin;
            }
        } else if (statement.kind === 'word' || statement.kind === 'instruction') {
            nextAddress += statement.values.length;
        }
        if ((statement.label || statement.explicitAddress !== undefined) && !inRange(statement.address, 0, 99)) {
            error('address-range', statement, 'A cell or label address must be between 00 and 99.');
        }
    }
    for (const [name, statement] of definitions) {
        if (inRange(statement.address, 0, 99)) symbols[name] = statement.address;
    }

    const occupied = new Map();
    for (const statement of statements) {
        if (statement.kind !== 'word' && statement.kind !== 'instruction') continue;
        for (let offset = 0; offset < statement.values.length; offset++) {
            const address = statement.address + offset;
            const operand = evaluate(statement.values[offset], statement);
            if (!inRange(address, 0, 99)) {
                error('address-range', statement, `Cell address ${address} is outside 00–99.`);
                continue;
            }
            if (occupied.has(address)) {
                error('duplicate-address', statement, `Cell ${String(address).padStart(2, '0')} was already written on line ${occupied.get(address)}.`);
                continue;
            }
            occupied.set(address, statement.line);
            if (operand === null) continue;
            const instruction = statement.kind === 'instruction';
            if (!inRange(operand, instruction ? 0 : -999, instruction ? 99 : 999)) {
                error(instruction ? 'operand-range' : 'word-range', statement,
                    instruction ? `${CARDIAC_MNEMONICS[statement.opcode]} operand must be between 00 and 99.` :
                        'A CARDIAC data word must be between -999 and 999.');
                continue;
            }
            const value = instruction ? statement.opcode * 100 + operand : operand;
            if (address === 0 && value !== 1) {
                error('fixed-zero-cell', statement, 'Cell 00 is fixed at 001 and cannot contain another word.');
                continue;
            }
            if (address === 99) warning('jump-return-cell', statement, 'JMP writes its return instruction to cell 99; this word may be replaced when a jump executes.');
            if (instruction && operand === 0 && [0, 6].includes(statement.opcode)) {
                warning('fixed-zero-target', statement, 'Cell 00 is fixed at 001; this instruction cannot replace it.');
            }
            const data = statement.data === true;
            if (entry === null && !data) entry = address;
            const word = {address, value, line: statement.line, column: statement.column};
            words.push(word);
            listing.push({...word, word: formatCardiacWord(value), source: statement.source,
                mnemonic: data ? 'DAT' : CARDIAC_MNEMONICS[Math.floor(value / 100)],
                operand: data ? null : value % 100});
        }
    }
    if (entryStatement) {
        const requested = evaluate(entryStatement.expression, entryStatement);
        if (requested !== null) {
            if (!inRange(requested, 0, 99)) error('entry-range', entryStatement, 'ENTRY must select an address between 00 and 99.');
            else entry = requested;
        }
    }
    words.sort((a, b) => a.address - b.address);
    listing.sort((a, b) => a.address - b.address);
    return finish();
}

/** Export sparse memory and its entry address as reparsable decimal source. */
export function exportCardiacListing (assembly) {
    if (!assembly || assembly.ok !== true || !Array.isArray(assembly.words) || assembly.words.length > 100) {
        throw new TypeError('Export requires a successful CARDIAC assembly.');
    }
    if (assembly.entry !== null && !inRange(assembly.entry, 0, 99)) throw new RangeError('Invalid CARDIAC entry address.');
    const seen = new Set();
    const rows = assembly.entry === null ? [] : [`ENTRY ${String(assembly.entry).padStart(2, '0')}`];
    for (const word of [...assembly.words].sort((a, b) => a.address - b.address)) {
        if (!inRange(word.address, 0, 99) || seen.has(word.address)) throw new RangeError('Invalid or duplicate CARDIAC cell address.');
        if (word.address === 0 && word.value !== 1) throw new RangeError('Cell 00 is fixed at 001.');
        seen.add(word.address);
        // Data-only source must remain data-only when reopened, with no invented
        // automatic entry point. Explicit ENTRY otherwise preserves intent.
        rows.push(`${String(word.address).padStart(2, '0')}: ${assembly.entry === null ? 'DAT ' : ''}${formatCardiacWord(word.value)}`);
    }
    return rows.length ? `${rows.join('\n')}\n` : '';
}

/** Parse a numeric input strip, not an addressed memory image. Atomic on error. */
export function parseCardiacDeck (source) {
    const values = [];
    const diagnostics = [];
    const reject = (code, line, column, message) => diagnostics.push(issue('error', code, line, column, message));
    if (typeof source !== 'string') reject('deck-type', 1, 1, 'A CARDIAC input strip must be text.');
    else if (source.length > CARDIAC_SOURCE_LIMITS.characters) reject('deck-size', 1, 1, `Input strip exceeds ${CARDIAC_SOURCE_LIMITS.characters} characters.`);
    else {
        const lines = source.replace(/^\uFEFF/, '').split(/\r\n?|\n/);
        for (let index = 0; index < lines.length; index++) {
            for (const token of commentless(lines[index]).matchAll(/[^\s,]+/g)) {
                const text = token[0];
                if (!/^[+-]?\d+$/.test(text) || !inRange(Number(text), -999, 999)) {
                    reject('deck-word', index + 1, token.index + 1, 'Input values must be decimal integers from -999 to 999.');
                } else values.push(normalZero(Number(text)));
                if (values.length > CARDIAC_SOURCE_LIMITS.deckValues) {
                    reject('deck-count', index + 1, token.index + 1, `Input strip exceeds ${CARDIAC_SOURCE_LIMITS.deckValues} values.`);
                    return {ok: false, values: [], diagnostics};
                }
            }
        }
    }
    return {ok: diagnostics.length === 0, values: diagnostics.length ? [] : values, diagnostics};
}

/** Canonical, portable numeric input strip; never a program-memory exporter. */
export function formatCardiacDeck (values) {
    if (!Array.isArray(values)) throw new TypeError('A CARDIAC input strip is an array of integers.');
    if (values.length > CARDIAC_SOURCE_LIMITS.deckValues) throw new RangeError('Too many CARDIAC input values.');
    return values.length ? `${Array.from(values, formatCardiacWord).join('\n')}\n` : '';
}
