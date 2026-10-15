import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from './helpers.mjs';

const topology=project=>{
 for(const target of project.targets){
  const blocks=target.blocks||{},parents=new Map();
  for(const[id,block]of Object.entries(blocks))for(const input of Object.values(block.inputs||{}))for(const child of input.slice(1))if(typeof child==='string'){
   assert.ok(blocks[child],'actual input child exists');
   assert.equal(blocks[child].parent,id,block.opcode+' owns '+blocks[child].opcode);
   assert.equal(parents.has(child),false,'reporter occurrence has one actual parent');parents.set(child,id);
  }
 }
};
for(const condition of ['not (x < 3)','not (not (x = 2))','(x < 3) and (not (x = 2))','not ((x >= 2) or (x != 3))','(x <= 3) or (x > 1)'])test('condition reporter topology: '+condition,()=>{
 const source=`SPRITE S:\nWHEN flag clicked:\n  set x to 2\n  if ${condition} then:\n    say "yes"`;
 const creator=build(source);assert.deepEqual(creator.warnings,[]);topology(creator.project);
 const code=creator.decompile(),again=build(code);topology(again.project);assert.equal(again.decompile(),code);
});
