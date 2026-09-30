// Shared helpers for the parser test suites.
import SB3Creator from '../src/utils/sb3Creator.js';

export function build(code) {
    const c = new SB3Creator();
    c.parse(code);
    return c;
}

/**
 * The parser's warnings for `code`, whether or not the parse was refused. A
 * refused declaration (a pin the board has no name for, a part this device
 * lacks) leaves the statements that use it with nothing to read them, and since
 * D5 such lines refuse the parse (UnparsedLinesError, which carries the
 * warnings) instead of being dropped. `refused` lists the unread lines.
 */
export function parseWarnings(code) {
    const c = new SB3Creator();
    try {
        c.parse(code);
        return {warnings: c.warnings, refused: []};
    } catch (e) {
        if (e.code !== 'DIALECT_UNPARSED_LINES') throw e;
        return {warnings: e.warnings, refused: e.lines};
    }
}

export function target(creator, name) {
    return creator.project.targets.find(t => (name === 'Stage' ? t.isStage : t.name === name));
}

export function blocksOf(creator, name) {
    return (target(creator, name) || {}).blocks || {};
}

export function opcodes(blocks) {
    return Object.values(blocks).map(b => b.opcode);
}

export function findBlock(blocks, opcode) {
    return Object.entries(blocks).find(([, b]) => b.opcode === opcode)?.[1];
}

export function findAll(blocks, opcode) {
    return Object.values(blocks).filter(b => b.opcode === opcode);
}

export function hasOpcode(blocks, opcode) {
    return Object.values(blocks).some(b => b.opcode === opcode);
}

// Follow an input slot [_, ref] to the referenced block (for value/boolean inputs).
export function inputBlock(blocks, block, key) {
    const input = block.inputs[key];
    if (!input) return null;
    const ref = input[1];
    return typeof ref === 'string' ? blocks[ref] : null;
}

// Wrap a single sprite script so snippets are easy to write.
export function sprite(name, body) {
    const indented = body.trim().split('\n').map(l => '    ' + l).join('\n');
    return `SPRITE ${name}:\n  WHEN flag clicked:\n${indented}\n`;
}
