import test from 'node:test';
import assert from 'node:assert/strict';
import Creator from '../src/utils/sb3Creator.js';

for(const [word,opcode] of [
 ['arcade draw image circle fillCircle canvas x 1 y 2 radius (radius + 0.9) color 17','arcade_drawImageCircle'],
 ['arcade draw circle drawCircle of actor x -1 y 2 radius 0 color -1','arcade_drawSpriteCircle']
])test(opcode+' has a fixed operation field and a connected radius input',()=>{
 const c=new Creator();c.parse('DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  '+word);
 assert.deepEqual(c.warnings,[]);
 const block=c.project.targets.flatMap(t=>Object.values(t.blocks)).find(b=>b.opcode===opcode);
 assert.ok(block);assert.ok(block.fields.OP);assert.equal(block.inputs.OP,undefined);
 assert.ok(block.inputs.RADIUS);assert.equal(block.inputs.W,undefined);assert.equal(block.inputs.H,undefined);
 const again=new Creator();again.parse(c.decompile());assert.deepEqual(again.warnings,[]);
 const restored=again.project.targets.flatMap(t=>Object.values(t.blocks)).find(b=>b.opcode===opcode);
 assert.deepEqual(restored.fields.OP,block.fields.OP);assert.ok(restored.inputs.RADIUS);
});

test('unknown and computed circle operation fields refuse unread source',()=>{
 for(const op of ['unknown','(operation)']){
  const c=new Creator();assert.throws(()=>c.parse('DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  arcade draw image circle '+op+' canvas x 1 y 2 radius 3 color 4'),e=>e.code==='DIALECT_UNPARSED_LINES');
 }
});
