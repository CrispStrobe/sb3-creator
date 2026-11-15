import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import Creator from '../src/utils/sb3Creator.js';
const names=['主角','跳床','Späher1','é','e\u0301','𐐀value','$数','a\u200Cb'];
const declarations=names.map(n=>`GLOBAL ${n}`).join('\n');
const code=`DEVICE ARCADE\n${declarations}\nSPRITE Game:\nWHEN arcade source starts:\n`+names.map(n=>`  declare arcade source reference ${n} as "Sprite"`).join('\n');
function inspect(c){
 assert.deepEqual(c.warnings,[]);const target=c.project.targets.find(t=>t.name==='Game'),stage=c.project.targets.find(t=>t.isStage);
 const ids=Object.values(target.blocks).filter(b=>b.opcode==='arcade_declareSourceReference').map(b=>{const value=b.inputs.VARIABLE[1],reporter=typeof value==='string'?target.blocks[value]:null;if(reporter)assert.equal(reporter.opcode,'data_variable');else assert.equal(value[0],12);return reporter?reporter.fields.VARIABLE[1]:value[2]});
 assert.equal(ids.length,names.length);assert.equal(new Set(ids).size,names.length);assert.deepEqual(ids.map(id=>stage.variables[id][0]),names);return ids;
}
test('declared Unicode identifiers bind exact distinct variable IDs through Code and fresh SB3',async()=>{
 const c=new Creator();c.parse(code);const ids=inspect(c),text=c.decompile(),again=new Creator();again.parse(text);inspect(again);assert.equal(again.decompile(),text);
 const zip=await JSZip.loadAsync(await(await c.generateSB3()).arrayBuffer()),fresh=new Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));assert.deepEqual(inspect(fresh),ids);assert.equal(fresh.decompile(),text);
});
test('Unicode admission requires a declaration and never invents names from text or expressions',()=>{
 for(const name of ['未知','"主角"','(主角 + 1)','主角.x','😺','e\u0301','1主角']){
  const c=new Creator();const declared=name==='e\u0301'?'é':name==='😺'?'😺':'主角';
  assert.throws(()=>c.parse(`DEVICE ARCADE\nGLOBAL ${declared}\nSPRITE Game:\nWHEN arcade source starts:\n  declare arcade source reference ${name} as "Sprite"`),/variable reporter/);
 }
});
test('declared Unicode scalar and list reads retain their ordinary reporter identities',()=>{
 const c=new Creator();c.parse('GLOBAL 数値\nGLOBAL LIST 項目\nSPRITE Game:\nWHEN flag clicked:\n  declare arcade source scalar 数値 as Number\n  set 数値 to 17\n  set result to 数値\n  set length to length of 項目');assert.deepEqual(c.warnings,[]);
 const t=c.project.targets.find(t=>t.name==='Game'),b=Object.values(t.blocks);assert.ok(b.some(x=>x.opcode==='arcade_declareSourceScalar'));assert.ok(b.some(x=>x.opcode==='data_lengthoflist'));
});
