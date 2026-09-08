#!/usr/bin/env node
// N2e corpus measurement: list declarations/operations which reach the i8086
// C emitter after the same conservative 8051 retarget used by Lite's reach gate.
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import SB3Creator from '../src/utils/sb3Creator.js';

const root = new URL('../examples/', import.meta.url);
const asText = result => typeof result === 'string' ? result :
    ['pseudocode', 'text', 'source', 'code'].map(key => result && result[key]).find(value => typeof value === 'string');
const opcodes = new Set([
    'data_addtolist', 'data_deleteoflist', 'data_deletealloflist',
    'data_insertatlist', 'data_replaceitemoflist', 'data_itemoflist',
    'data_lengthoflist', 'data_itemnumoflist', 'data_listcontainsitem'
]);
const out = {programs: 0, listPrograms: [], operations: {}, declaredLists: 0,
    maximumListsPerProgram: 0, maximumInitialLength: 0, terminal: {emitted: [], refused: [], choked: []}};

for (const entry of (await readdir(root, {withFileTypes: true})).filter(item => item.isDirectory())) {
    let source;
    try { source = await readFile(new URL(`${entry.name}/program.bw`, root), 'utf8'); } catch { continue; }
    out.programs++;
    const retargeted = SB3Creator.retargetPseudocode(source, 'stc12c5a60s2');
    if (retargeted && retargeted.ok === false) continue;
    const creator = new SB3Creator();
    creator.parse(asText(retargeted).replace(/^DEVICE .*$/m, 'DEVICE i8086'));
    const found = {};
    let lists = 0;
    for (const target of creator.project.targets || []) {
        const declared = Object.values(target.lists || {});
        lists += declared.length;
        for (const list of declared) out.maximumInitialLength = Math.max(out.maximumInitialLength,
            Array.isArray(list[1]) ? list[1].length : 0);
        for (const block of Object.values(target.blocks || {})) {
            if (!opcodes.has(block.opcode)) continue;
            found[block.opcode] = (found[block.opcode] || 0) + 1;
            out.operations[block.opcode] = (out.operations[block.opcode] || 0) + 1;
        }
    }
    if (!Object.keys(found).length) continue;
    out.declaredLists += lists;
    out.maximumListsPerProgram = Math.max(out.maximumListsPerProgram, lists);
    const generated = creator.generateC();
    const code = typeof generated === 'string' ? generated : generated.code;
    const row = {name: entry.name, lists, operations: found};
    out.listPrograms.push(row);
    if (!/^\/\* No C emitted/.test(code)) out.terminal.emitted.push(entry.name);
    else if ((creator._cListRefused || []).length) out.terminal.refused.push({name: entry.name, reasons: creator._cListRefused});
    else out.terminal.choked.push({name: entry.name,
        features: Object.keys(creator._cUses || {}).filter(key => creator._cUses[key] &&
            !new Set(['shiftOut', 'delay', 'printNumber', 'numericLists']).has(key))});
}

out.listPrograms.sort((a, b) => a.name.localeCompare(b.name));
for (const rows of Object.values(out.terminal)) rows.sort((a, b) =>
    String(a.name || a).localeCompare(String(b.name || b)));
console.log(JSON.stringify(out, null, 2));
