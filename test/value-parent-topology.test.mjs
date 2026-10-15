import test from 'node:test';
import assert from 'node:assert/strict';
import Creator from '../src/utils/sb3Creator.js';

const score='arcade player (1) score';
const source=statement=>`DEVICE ARCADE\nGLOBAL result\nSPRITE Game:\nDEFINE keep (count):\n  declare arcade procedure "keep %s" parameter "count" as Number\n  ${statement}\n`;
function parse(code) {
    const creator=new Creator();
    creator.parse(code);
    assert.deepEqual(creator.warnings,[]);
    return creator;
}
function topology(creator) {
    let edges=0;
    for (const target of creator.project.targets) {
        const owners=new Set();
        for (const [id,block] of Object.entries(target.blocks)) {
            for (const input of Object.values(block.inputs)) {
                for (const child of input.slice(1)) {
                    if (typeof child !== 'string') continue;
                    assert.ok(target.blocks[child],`${block.opcode} input exists`);
                    assert.equal(target.blocks[child].parent,id,`${block.opcode} owns ${target.blocks[child].opcode}`);
                    assert.equal(owners.has(child),false,'one immediate input owner');
                    owners.add(child);edges++;
                }
            }
        }
    }
    // MEASURED 2026-10-15: all 13 fixtures, before/after reparse, have 4-7
    // edges across 26 checks. Join, mod, unary negation and bitnot reach the
    // minimum of 4; retain that measured nonvacuity floor.
    assert.ok(edges>=4,'actual constrained prototype and nested value edges inspected');
}
for (const expression of [
    `calculate value ("total ") op "+" with (("" join (${score})))`,
    `join "total " (${score})`,
    `(${score}) + ((${score}) - 1)`,
    `(${score}) * ((${score}) / 2)`,
    `(${score}) mod 2`,
    `-(${score})`,
    `round ((${score}) / 2)`,
    `abs of ((${score}) - 2)`,
    `bitnot (${score})`,
    `(${score}) bitand ((${score}) bitor 2)`,
    `letter ((${score}) + 1) of ("x" join (${score}))`,
    `pick random ((${score}) + 1) to ((${score}) * 2)`
]) test('value wrapper owns nested reporters: '+expression,()=>{
    const creator=parse(source(`set result to (${expression})`));topology(creator);
    const code=creator.decompile(),again=parse(code);topology(again);
    assert.equal(again.decompile(),code);
});
test('Arcade numeric truth conversion owns equality and not chain',()=>{
    const creator=parse(source(`arcade set hud score visible (${score})`));topology(creator);
    const code=creator.decompile(),again=parse(code);topology(again);
    assert.equal(again.decompile(),code);
});
test('builder adopts direct reporter and shadow only, preserving descendants and external references',()=>{
    const creator=new Creator();
    const context={parentId:'outer',extraBlocks:{leaf:{parent:'nested'},nested:{parent:'outer'},shadow:{parent:'outer'}},target:{blocks:{external:{parent:'foreign'}}}};
    const id=creator.pushBlock(context,'operator_join',{STRING1:[3,'nested','shadow'],STRING2:[3,'external',[10,'']],VARIABLE:[3,[12,'v','var-id'],[10,'']]});
    assert.equal(context.extraBlocks[id].parent,'outer');
    assert.equal(context.extraBlocks.nested.parent,id);assert.equal(context.extraBlocks.shadow.parent,id);
    assert.equal(context.extraBlocks.leaf.parent,'nested');
    assert.equal(context.target.blocks.external.parent,'foreign');
});
test('validator still rejects a corrupted nested reporter parent',()=>{
    const creator=parse(source(`set result to ("" join (${score}))`));
    const blocks=creator.project.targets.find(t=>!t.isStage).blocks;
    const reporter=Object.values(blocks).find(b=>b.opcode==='arcade_getPlayerScore');
    reporter.parent='foreign';
    assert.throws(()=>creator.decompile(),/parent ownership/);
});
