import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
function source(type,variable='pending') {return `DEVICE ARCADE\nGLOBAL pending\nSPRITE Game:\nWHEN arcade source starts:\n  declare arcade source reference ${variable} as ${JSON.stringify(type)}\n  set pending to (undefined value)`;}
function inspect(c,type) {
  assert.deepEqual(c.warnings,[]);
  const target=c.project.targets.find(t=>t.name==='Game');
  const block=Object.values(target.blocks).find(b=>b.opcode==='arcade_declareSourceReference');
  assert.equal(block.fields.TYPE[0],type);assert.equal(block.inputs.TYPE,undefined);
  const slot=block.inputs.VARIABLE[1],reporter=typeof slot==='string'?target.blocks[slot]:null;
  const id=reporter?reporter.fields.VARIABLE[1]:slot[2];
  assert.equal(reporter?.opcode||(slot[0]===12&&'data_variable'),'data_variable');
  assert.ok(c.project.targets.find(t=>t.isStage).variables[id]);return id;
}
test('reference type is a direct quoted field with real variable ID through Code and fresh SB3',async()=>{
  for(const type of ['Sprite','Image','number[]','boolean[]','string[]','Sprite[]','Image[]','Box','Namespace.Box','Namespace.Box[]']) {
    const c=new SB3Creator();c.parse(source(type));const id=inspect(c,type),code=c.decompile();
    assert.ok(code.includes(`as ${JSON.stringify(type)}`));
    const again=new SB3Creator();again.parse(code);inspect(again,type);assert.equal(again.decompile(),code);
    const zip=await JSZip.loadAsync(await(await c.generateSB3()).arrayBuffer());
    const fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));
    assert.equal(inspect(fresh,type),id);assert.equal(fresh.decompile(),code);
  }
});
test('computed type and computed variable bindings cannot replace direct source field and ID',()=>{
  for(const variable of ['"pending"','(pending + 1)','(undefined value)','5'])assert.throws(()=>new SB3Creator().parse(source('Sprite',variable)),/variable reporter/);
  for(const type of ['Sprite','(join "Spr" "ite")','"Namespace..Box"','"Box[][]"','"number[ ]"','"Box\\\"bad"'])
    assert.throws(()=>new SB3Creator().parse(source('Sprite').replace('"Sprite"',type)));
});
