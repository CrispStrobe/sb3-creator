import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import {legacyDirectMenuValue,normalizeArcadeBlockSchema} from '../src/utils/arcadeDialect.js';
for(const op of ['min','max','randomRange','atan2']) test(`native math ${op} survives edited Code and legacy migration`,()=>{
 const c=new SB3Creator();c.parse(`DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  set [result] to (arcade math ${op} first (1) second (4))`);
 assert.deepEqual(c.warnings,[]);const t=c.project.targets.find(t=>t.name==='Game');const [id,b]=Object.entries(t.blocks).find(([,b])=>b.opcode==='arcade_mathBinary');
 assert.deepEqual(b.fields.OP,[op,null]);assert.equal(b.inputs.OP,undefined);
 b.fields.OP[0]='max';assert.match(c.decompile(),/arcade math max first/);
 delete b.fields.OP;b.inputs.OP=[1,'legacy'];t.blocks.legacy={opcode:'arcade_menu_mathOperations',fields:{mathOperations:[op,null]},inputs:{},shadow:true,parent:id};
 assert.equal(legacyDirectMenuValue(b,'OP',t.blocks),op);assert.match(c.decompile(),new RegExp(`arcade math ${op} first`));
 assert.equal(normalizeArcadeBlockSchema(b,{id,blocks:t.blocks}),true);assert.deepEqual(b.fields.OP,[op,null]);assert.equal(t.blocks.legacy,undefined);
});
test('atan2 retains first y and second x through connected variables and current Code',()=>{
 const creator=new SB3Creator();creator.parse(`DEVICE ARCADE
SPRITE Game:
WHEN flag clicked:
  set [north] to (1)
  set [east] to (-1)
  set [result] to (arcade math atan2 first (north) second (east))`);
 assert.deepEqual(creator.warnings,[]);
 const target=creator.project.targets.find(target=>target.name==='Game');
 const block=Object.values(target.blocks).find(block=>block.opcode==='arcade_mathBinary');
 const variable=(target,slot)=>{
  if(Array.isArray(slot)){assert.equal(slot[0],12);return slot[1];}
  assert.equal(target.blocks[slot].opcode,'data_variable');return target.blocks[slot].fields.VARIABLE[0];
 };
 assert.deepEqual(block.fields.OP,['atan2',null]);assert.equal(block.inputs.OP,undefined);
 assert.equal(variable(target,block.inputs.A[1]),'north');
 assert.equal(variable(target,block.inputs.B[1]),'east');
 const code=creator.decompile();assert.match(code,/arcade math atan2 first north second east/);
 const reopened=new SB3Creator();reopened.parse(code);assert.deepEqual(reopened.warnings,[]);
 const next=reopened.project.targets.find(target=>target.name==='Game');
 const again=Object.values(next.blocks).find(block=>block.opcode==='arcade_mathBinary');
 assert.equal(variable(next,again.inputs.A[1]),'north');
 assert.equal(variable(next,again.inputs.B[1]),'east');
});
for(const shape of ['computed','wrongMenu','notShadow','unknown']) test(`math ${shape} cannot silently become a fixed operation`,()=>{
 const b={opcode:'arcade_mathBinary',inputs:{OP:[1,'m']},fields:{}};const blocks={b,m:{opcode:'arcade_menu_mathOperations',shadow:true,fields:{mathOperations:['max',null]},inputs:{},parent:'b'}};
 if(shape==='computed')b.inputs.OP=[3,'v','m'];if(shape==='wrongMenu')blocks.m.opcode='arcade_menu_settingReadTypes';if(shape==='notShadow')blocks.m.shadow=false;if(shape==='unknown')blocks.m.fields.mathOperations[0]='other';
 const before=structuredClone({b,blocks});assert.equal(legacyDirectMenuValue(b,'OP',blocks),undefined);assert.equal(normalizeArcadeBlockSchema(b,{id:'b',blocks}),false);assert.deepEqual({b,blocks},before);
});
