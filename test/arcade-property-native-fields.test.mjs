import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import {ARCADE_DIRECT_MENUS,arcadeWordFor,compileArcadeWord,legacyDirectMenuValue,normalizeArcadeBlockSchema} from '../src/utils/arcadeDialect.js';
for(const [opcode,slots] of Object.entries(ARCADE_DIRECT_MENUS))for(const [slot,menu] of Object.entries(slots)){
 const entry=arcadeWordFor(opcode),part=compileArcadeWord(entry).parts.find(p=>p.slot===slot);
 for(const choice of part.choices)test(`${opcode}.${slot} ${choice} remains an actual field across legacy Code regeneration`,()=>{
  assert.equal(part.field,true);const b={opcode,fields:{},inputs:{[slot]:[1,'m']}};const blocks={b,m:{opcode:`arcade_menu_${menu}`,fields:{[menu]:[choice,null]},inputs:{},shadow:true,parent:'b'}};
  assert.equal(legacyDirectMenuValue(b,slot,blocks),choice);assert.equal(normalizeArcadeBlockSchema(b,{id:'b',blocks}),true);assert.deepEqual(b.fields[slot],[choice,null]);assert.equal(blocks.m,undefined);
  const words=compileArcadeWord(entry).parts.map(p=>p.literal??(p.field?(p.quoted?JSON.stringify(p.slot===slot?choice:p.choices[0]):(p.slot===slot?choice:p.choices[0])):'(undefined value)')).join(' ');
  const source=entry.kind==='command'?words:`set [r] to (${words})`;
  const c=new SB3Creator();c.parse(`DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  ${source}`);assert.deepEqual(c.warnings,[]);
  const t=c.project.targets.find(t=>t.name==='Game'),[id,native]=Object.entries(t.blocks).find(([,b])=>b.opcode===opcode);
  assert.deepEqual(native.fields[slot],[choice,null]);delete native.fields[slot];native.inputs[slot]=[1,'old-menu'];
  t.blocks['old-menu']={opcode:`arcade_menu_${menu}`,fields:{[menu]:[choice,null]},inputs:{},shadow:true,parent:id};
  const code=c.decompile();const fresh=new SB3Creator();fresh.parse(code);assert.deepEqual(fresh.warnings,[]);const again=fresh.project.targets.flatMap(t=>Object.values(t.blocks)).find(b=>b.opcode===opcode);assert.deepEqual(again.fields[slot],[choice,null]);assert.equal(again.inputs[slot],undefined);
 });
}
