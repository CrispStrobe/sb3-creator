import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import SB3Creator from '../src/utils/sb3Creator.js';
import {sanitizeIdent} from '../src/utils/scratchRuntime.js';

// Generated from an independently authored zero-argument declaration with two
// reads. This is a compiler representation test, not native callable admission.
const source=readFileSync(new URL('./fixtures/named-declaration-variable-renames.pseudo',import.meta.url),'utf8');
const build=()=>{const c=new SB3Creator();c.parse(source);assert.deepEqual(c.warnings,[]);return c;};
const literal=(blocks,input)=>Array.isArray(input[1])?input[1][1]:blocks[input[1]].fields.TEXT[0];
const state=project=>{
 const stage=project.targets.find(t=>t.isStage),target=project.targets.find(t=>t.name==='Game'),blocks=target.blocks;
 const variables=Object.values(blocks).filter(b=>b.opcode==='arcade_declareSourceCallable');
 const declaration=Object.values(blocks).find(b=>b.opcode==='arcade_declareCallable');
 return {stage,target,blocks,variables,declaration,metadata:JSON.parse(literal(blocks,declaration.inputs.METADATA))};
};
const rename=(project,id,name)=>{
 const owner=project.targets.find(t=>Object.hasOwn(t.variables||{},id));owner.variables[id][0]=name;
 for(const target of project.targets)for(const block of Object.values(target.blocks||{})){
  if(block.fields?.VARIABLE?.[1]===id)block.fields.VARIABLE[0]=name;
  for(const input of Object.values(block.inputs||{}))for(const value of input.slice(1))if(Array.isArray(value)&&value[0]===12&&value[2]===id)value[1]=name;
 }
};

test('actual sanitized named-label variable rename survives compiler Code regeneration and fresh IDs',()=>{
 const c=build(),s=state(c.project),first=s.variables.find(b=>b.inputs.VARIABLE[1][1]==='first');
 const original=JSON.parse(literal(s.blocks,first.inputs.SIGNATURE)),name=sanitizeIdent('first label!?');assert.match(name,/^[A-Za-z_]\w*$/);
 const before=structuredClone(s.metadata);rename(c.project,original.variableId,name);
 const saved=JSON.stringify(c.project),code=c.decompile();assert.equal(JSON.stringify(c.project),saved,'Code refresh does not mutate the saved project');
 const fresh=new SB3Creator();fresh.parse(code);assert.deepEqual(fresh.warnings,[]);const next=state(fresh.project);
 const variable=next.variables.find(b=>b.inputs.VARIABLE[1][1]===name),envelope=JSON.parse(literal(next.blocks,variable.inputs.SIGNATURE));
 assert.notEqual(envelope.variableId,original.variableId,'fresh compilation issues a new actual variable ID');
 assert.equal(envelope.variableId,variable.inputs.VARIABLE[1][2]);assert.equal(envelope.variableName,name);assert.equal(envelope.binding,original.binding);
 assert.equal(next.metadata.version,3);assert.equal(next.metadata.plan.bindings.find(b=>b.id===envelope.binding).nativeName,name);
 assert.equal(next.metadata.site,before.site);assert.deepEqual(next.metadata.plan.sites,before.plan.sites);
 assert.equal(next.metadata.plan.bindings.find(b=>b.nativeName==='second').id,before.plan.bindings.find(b=>b.nativeName==='second').id);
 // Fresh compilation deliberately reissues variable IDs. Validate those exact
 // seals above; compare the remaining visible statements and complete plan.
 const visible=text=>text.split('\n').filter(line=>!line.trimStart().startsWith('declare arcade source callable ')).join('\n');
 assert.equal(visible(fresh.decompile()),visible(code));
 for(const declaration of next.variables){const value=JSON.parse(literal(next.blocks,declaration.inputs.SIGNATURE));assert.equal(value.variableId,declaration.inputs.VARIABLE[1][2]);assert.equal(value.variableName,declaration.inputs.VARIABLE[1][1]);}
});

test('named profile refresh still refuses swapped actual IDs, incompatible spelling and unknown profiles',()=>{
 for(const change of ['id','spelling','version2','version4']){
  const c=build(),s=state(c.project),first=s.variables.find(b=>b.inputs.VARIABLE[1][1]==='first');
  if(change==='id')first.inputs.VARIABLE[1]=structuredClone(s.variables.find(b=>b.inputs.VARIABLE[1][1]==='second').inputs.VARIABLE[1]);
  else {
   const metadata=s.metadata;
   if(change==='spelling')metadata.plan.bindings.find(b=>b.nativeName==='first').nativeName='unowned';
   else metadata.version=change==='version2'?2:4;
   s.declaration.inputs.METADATA=[1,[10,JSON.stringify(metadata)]];
  }
  assert.throws(()=>c.decompile(),/ID seal changed|spelling seal differs|Malformed callable lexical plan/);
 }
});
