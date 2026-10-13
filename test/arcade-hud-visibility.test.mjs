import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
const source=`DEVICE ARCADE
SPRITE Game:
WHEN flag clicked:
  arcade set hud score visible (1 = 0)
  arcade set hud life visible (1 < 2)
  arcade set hud countdown visible not (1 = 0)
  set rawOffset to ((arcade camera draw offset x) + 1)
  set spriteFlags to ((arcade property flags of actor) + 0)`;
const inspect=creator=>{assert.deepEqual(creator.warnings,[]);const target=creator.project.targets.find(t=>t.name==='Game'),blocks=target.blocks,ops=Object.values(blocks).filter(b=>b.opcode==='arcade_setHudVisibility');assert.equal(ops.length,3);assert.deepEqual(ops.map(b=>b.fields.ELEMENT[0]),['score','life','countdown']);assert.deepEqual(ops.map(b=>blocks[b.inputs.VISIBLE[1]].opcode),['operator_equals','operator_lt','operator_not']);for(const b of ops)assert.equal(b.inputs.VISIBLE[0],2);const offset=Object.values(blocks).find(b=>b.opcode==='arcade_cameraDrawOffset');assert.equal(offset.fields.AXIS[0],'x');const flags=Object.values(blocks).find(b=>b.opcode==='arcade_spriteProperty' && b.fields.PROPERTY[0]==='flags');assert.ok(flags);for(const reporter of [offset,flags])assert.ok(Object.values(blocks).some(b=>b.opcode==='operator_add' && blocks[b.inputs.NUM1[1]]===reporter));return target;};
test('HUD choice and Boolean connection survive actual Code and fresh SB3 decompilation',async()=>{
 const creator=new SB3Creator();creator.parse(source);const original=inspect(creator);const code=creator.decompile();const codeCreator=new SB3Creator();codeCreator.parse(code);inspect(codeCreator);assert.equal(codeCreator.decompile(),code);
 const zip=await JSZip.loadAsync(await(await creator.generateSB3()).arrayBuffer());const fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('string'));assert.deepEqual(inspect(fresh).blocks,original.blocks);assert.equal(fresh.decompile(),code);
});
