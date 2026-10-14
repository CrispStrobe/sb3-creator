import {test} from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
const signature={kind:'callable',parameters:[],result:{kind:'named',name:'number'}};
const envelope={schema:'bw-callable-variable',version:1,binding:'binding_1',variableName:'first',signature};
const code=value=>`DEVICE ARCADE\nGLOBAL first\nGLOBAL second\nSPRITE Game:\nWHEN arcade source starts:\n  declare arcade source callable first signature ${JSON.stringify(JSON.stringify(value))}\n`;
const literal=(blocks,input)=>Array.isArray(input[1])?input[1][1]:blocks[input[1]].fields.TEXT[0];
test('source materialization seals the actual variable ID and Code refresh retains spelling authority',()=>{
 const creator=new SB3Creator();creator.parse(code(envelope));assert.deepEqual(creator.warnings,[]);
 const target=creator.project.targets.find(target=>target.name==='Game');
 const declaration=Object.values(target.blocks).find(block=>block.opcode==='arcade_declareSourceCallable');
 const actual=JSON.parse(literal(target.blocks,declaration.inputs.SIGNATURE));
 assert.ok(actual.variableId);assert.equal(actual.variableId,declaration.inputs.VARIABLE[1][2]);
 const second=new SB3Creator();second.parse(creator.decompile());assert.deepEqual(second.warnings,[]);
 const rewired=new SB3Creator();assert.throws(()=>rewired.parse(creator.decompile().replace('declare arcade source callable first','declare arcade source callable second')),/actual variable binding/);
});
test('raw reporter ID swap, deleted and foreign IDs refuse during Code emission',()=>{
 const creator=new SB3Creator();creator.parse(code(envelope));
 for(const change of ['foreign','deleted','second']) {
  const project=JSON.parse(JSON.stringify(creator.project));const target=project.targets.find(target=>target.name==='Game');
  const declaration=Object.values(target.blocks).find(block=>block.opcode==='arcade_declareSourceCallable');
  const variables=project.targets.find(target=>target.isStage).variables;
  if(change==='deleted')delete variables[declaration.inputs.VARIABLE[1][2]];
  else declaration.inputs.VARIABLE[1]=[12,change,change==='foreign'?'foreign-id':Object.entries(variables).find(([,value])=>value[0]==='second')[0]];
  assert.throws(()=>creator.decompile(project),/ID seal changed/);
 }
});
test('nonvariable, computed signature and unsupported lexical envelope versions refuse',()=>{
 for(const value of [{...envelope,version:2},{...envelope,unknown:true},{...envelope,variableId:''},{...envelope,variableName:'second'}]) {
  const creator=new SB3Creator();assert.throws(()=>creator.parse(code(value)),/Malformed|binding/);
 }
 for(const source of [code(envelope).replace('callable first signature','callable (1 + 2) signature'),code(envelope).replace(/signature .*/, 'signature first')]) {
  const creator=new SB3Creator();assert.throws(()=>creator.parse(source),/variable reporter|fixed text/);
 }
});
test('bare concrete authoring signature has no lexical variable ID authority',()=>{
 const creator=new SB3Creator();creator.parse(code(signature));assert.deepEqual(creator.warnings,[]);
 const target=creator.project.targets.find(target=>target.name==='Game'),declaration=Object.values(target.blocks).find(block=>block.opcode==='arcade_declareSourceCallable');
 assert.deepEqual(JSON.parse(literal(target.blocks,declaration.inputs.SIGNATURE)),signature);
});
