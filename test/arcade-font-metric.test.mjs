import test from 'node:test';import assert from 'node:assert/strict';import JSZip from 'jszip';import SB3Creator from '../src/utils/sb3Creator.js';
const make=()=>{const c=new SB3Creator();c.parse('DEVICE ARCADE\nSPRITE Game:\nWHEN arcade source starts:\n  set result to (arcade font "font5" metric "charHeight")\n');assert.deepEqual(c.warnings,[]);return c;};
test('font reporter uses direct validated fields through Code and actual fresh SB3',async()=>{
 for(const FONT of ['font5','font8','font12'])for(const PROPERTY of ['charWidth','charHeight']){
  const c=make(),target=c.project.targets.find(t=>!t.isStage),block=Object.values(target.blocks).find(b=>b.opcode==='arcade_fontMetric');block.fields.FONT[0]=FONT;block.fields.PROPERTY[0]=PROPERTY;assert.deepEqual(block.inputs,{});
  const code=c.decompile();assert.ok(code.includes(`arcade font "${FONT}" metric "${PROPERTY}"`));const roundtrip=new SB3Creator();roundtrip.parse(code);assert.deepEqual(roundtrip.warnings,[]);assert.equal(roundtrip.decompile(),code);
  const zip=await JSZip.loadAsync(Buffer.from(await(await c.generateSB3()).arrayBuffer())),fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));assert.equal(fresh.decompile(),code);
 }
});
test('font selectors reject dynamic inputs and invalid fields without a default metric',()=>{
 for(const slot of ['FONT','PROPERTY']){const c=make(),block=Object.values(c.project.targets.find(t=>!t.isStage).blocks).find(b=>b.opcode==='arcade_fontMetric');block.inputs[slot]=[3,'dynamic',[10,'font5']];assert.throws(()=>c.decompile(),/requires a fixed/);}
 for(const [FONT,PROPERTY]of [['custom','charHeight'],['font5','width']]){const c=new SB3Creator();assert.throws(()=>c.parse(`DEVICE ARCADE\nWHEN flag clicked:\n  set result to (arcade font "${FONT}" metric "${PROPERTY}")\n`));}
});
