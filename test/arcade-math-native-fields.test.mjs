import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import {legacyDirectMenuValue,normalizeArcadeBlockSchema} from '../src/utils/arcadeDialect.js';
for(const op of ['min','max','randomRange']) test(`native math ${op} survives edited Code and legacy migration`,()=>{
 const c=new SB3Creator();c.parse(`DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  set [result] to (arcade math ${op} first (1) second (4))`);
 assert.deepEqual(c.warnings,[]);const t=c.project.targets.find(t=>t.name==='Game');const [id,b]=Object.entries(t.blocks).find(([,b])=>b.opcode==='arcade_mathBinary');
 assert.deepEqual(b.fields.OP,[op,null]);assert.equal(b.inputs.OP,undefined);
 b.fields.OP[0]='max';assert.match(c.decompile(),/arcade math max first/);
 delete b.fields.OP;b.inputs.OP=[1,'legacy'];t.blocks.legacy={opcode:'arcade_menu_mathOperations',fields:{mathOperations:[op,null]},inputs:{},shadow:true,parent:id};
 assert.equal(legacyDirectMenuValue(b,'OP',t.blocks),op);assert.match(c.decompile(),new RegExp(`arcade math ${op} first`));
 assert.equal(normalizeArcadeBlockSchema(b,{id,blocks:t.blocks}),true);assert.deepEqual(b.fields.OP,[op,null]);assert.equal(t.blocks.legacy,undefined);
});
for(const shape of ['computed','wrongMenu','notShadow','unknown']) test(`math ${shape} cannot silently become a fixed operation`,()=>{
 const b={opcode:'arcade_mathBinary',inputs:{OP:[1,'m']},fields:{}};const blocks={b,m:{opcode:'arcade_menu_mathOperations',shadow:true,fields:{mathOperations:['max',null]},inputs:{},parent:'b'}};
 if(shape==='computed')b.inputs.OP=[3,'v','m'];if(shape==='wrongMenu')blocks.m.opcode='arcade_menu_settingReadTypes';if(shape==='notShadow')blocks.m.shadow=false;if(shape==='unknown')blocks.m.fields.mathOperations[0]='other';
 const before=structuredClone({b,blocks});assert.equal(legacyDirectMenuValue(b,'OP',blocks),undefined);assert.equal(normalizeArcadeBlockSchema(b,{id:'b',blocks}),false);assert.deepEqual({b,blocks},before);
});
