import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import Creator from '../src/utils/sb3Creator.js';
import {validateProcedureParameterConstraints} from '../src/utils/procedureParameterConstraints.js';
import {ARCADE_DIALECT_OPS,ARCADE_WORDS} from '../src/utils/arcadeDialect.js';
const header='DEVICE ARCADE\nSPRITE Game:\n';
const declaration=(type='String')=>`declare arcade procedure "holdText %s" parameter "thisText" as ${type}`;
const source=(line=declaration())=>header+`DEFINE holdText (thisText):\n  ${line}\n  arcade log thisText\n`;
const parse=code=>{const c=new Creator();c.parse(code);assert.deepEqual(c.warnings,[]);return c;};
const target=c=>c.project.targets.find(t=>!t.isStage);
test('three new exact opcodes retain every prior word and explicit native input/field schemas',()=>{
 assert.equal(ARCADE_DIALECT_OPS.length,404);assert.equal(ARCADE_WORDS.length,409);
 for(const op of ['arcade_declareParameterConstraint','arcade_throwValue','arcade_createOwnedImageSprite'])assert.equal(ARCADE_WORDS.filter(w=>w.op===op).length,1);
 const c=parse(header+'WHEN flag clicked:\n  arcade throw (calculate value (2) op "+" with (3))\n  set result to (arcade create owned image (arcade local canvas) template "Player" kind (2 + 1))\n');
 const blocks=Object.values(target(c).blocks),thrown=blocks.find(b=>b.opcode==='arcade_throwValue'),sprite=blocks.find(b=>b.opcode==='arcade_createOwnedImageSprite');
 assert.deepEqual(Object.keys(thrown.inputs),['VALUE']);assert.deepEqual(Object.keys(sprite.inputs).sort(),['IMAGE','KIND','TEMPLATE']);
 assert.equal(blocks.some(b=>b.opcode==='arcade_log'),false);assert.equal(blocks.some(b=>b.opcode==='arcade_createImageSprite'),false);
 const replay=parse(c.decompile());assert.equal(replay.decompile(),c.decompile());
});
test('unused declarations retain fixed visible selectors and actual prototype IDs through fresh SB3',async()=>{
 for(const type of ['Number','String','Boolean','Any']) {
  const c=parse(source(declaration(type))),t=target(c),blocks=Object.values(t.blocks),entry=blocks.find(b=>b.opcode==='arcade_declareParameterConstraint');
  assert.deepEqual(entry.inputs,{});assert.deepEqual(entry.fields,{PROCEDURE:['holdText %s',null],PARAMETER:['thisText',null],TYPE:[type,null]});
  const def=blocks.find(b=>b.opcode==='procedures_definition'),proto=t.blocks[def.inputs.custom_block[1]];assert.equal(def.next,Object.keys(t.blocks).find(id=>t.blocks[id]===entry));assert.deepEqual(JSON.parse(proto.mutation.argumentnames),['thisText']);
  assert.equal(blocks.some(b=>b.opcode==='procedures_call'),false,'no invented caller');
  const zip=await JSZip.loadAsync(Buffer.from(await(await c.generateSB3()).arrayBuffer()));const fresh=new Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));
  assert.equal(fresh.decompile(),c.decompile());assert.equal(parse(fresh.decompile()).decompile(),c.decompile());
 }
});
test('computed, foreign, duplicate and non-prefix procedure declarations refuse visibly',()=>{
 for(const code of [source('declare arcade procedure (join "hold" "Text %s") parameter "thisText" as String'),source('declare arcade procedure "other %s" parameter "thisText" as String'),source('declare arcade procedure "holdText %s" parameter "missing" as String'),source(declaration()+'\n  '+declaration()),source('arcade log "before"\n  '+declaration()),header+'WHEN flag clicked:\n  '+declaration()+'\n'])assert.throws(()=>new Creator().parse(code),/Procedure parameter constraint|unreadable|not read|unparsed|cannot|reads/i,code);
});
test('current edited formal/prototype/call identities must remain bound or explicitly refuse',()=>{
 const c=parse(source()),t=target(c),proto=Object.values(t.blocks).find(b=>b.opcode==='procedures_prototype');proto.mutation.argumentnames='["renamed"]';
 assert.throws(()=>c.decompile(),/Procedure parameter constraint/);
 const valid=parse(source()),entry=Object.values(target(valid).blocks).find(b=>b.opcode==='arcade_declareParameterConstraint');entry.inputs.PARAMETER=[1,[10,'thisText']];assert.throws(()=>valid.decompile(),/fixed selector/);
});
test('Throw and owned factory retain connected edits instead of baking original values',()=>{
 const c=parse(header+'WHEN flag clicked:\n  arcade throw (undefined value)\n  set result to (arcade create owned image (arcade local canvas) template "Player" kind 2)\n');const blocks=Object.values(target(c).blocks),thrown=blocks.find(b=>b.opcode==='arcade_throwValue'),sprite=blocks.find(b=>b.opcode==='arcade_createOwnedImageSprite');
 thrown.inputs.VALUE=[1,[10,'20']];sprite.inputs.KIND=[1,[4,'7']];const out=c.decompile();assert.match(out,/arcade throw "20"/);assert.match(out,/kind 7/);assert.equal(parse(out).decompile(),out);
});

test('ordered actual caller IDs and explicit required arguments cannot drift from the visible declaration',()=>{
 const c=parse(source()+'WHEN flag clicked:\n  holdText ("ok")\n'),t=target(c),call=Object.values(t.blocks).find(b=>b.opcode==='procedures_call');
 const original=call.mutation.argumentids;call.mutation.argumentids='["foreign"]';assert.throws(()=>c.decompile(),/formal IDs/);call.mutation.argumentids=original;
 delete call.inputs[JSON.parse(original)[0]];assert.throws(()=>c.decompile(),/formal IDs/);
});

test('metadata-only declarations cannot erase hidden connected inputs during decompilation',()=>{
 const c=parse(source()),t=target(c),entry=Object.values(t.blocks).find(b=>b.opcode==='arcade_declareParameterConstraint');
 entry.inputs.EXTRA=[1,'effect'];t.blocks.effect={opcode:'arcade_callFunction',parent:Object.keys(t.blocks).find(id=>t.blocks[id]===entry),next:null,inputs:{NAME:[1,[10,'sideEffect']],ARGS:[1,[10,'[]']]},fields:{}};
 assert.throws(()=>c.decompile(),/zero inputs/);
 const ordinary=parse(header+'WHEN flag clicked:\n  arcade log "ok"\n');target(ordinary).blocks.unused=null;assert.doesNotThrow(()=>validateProcedureParameterConstraints(ordinary.project));
});

test('current constrained prototypes refuse extra inputs, next chains and malformed defaults instead of repairing them',()=>{
 for(const change of [
  proto=>{proto.inputs.EXTRA=[1,[10,'ignored']];},
  proto=>{proto.next='unrepresented';},
  proto=>{proto.mutation.argumentdefaults='[]';},
  proto=>{proto.mutation.argumentdefaults='not JSON';},
  proto=>{proto.fields.EXTRA=['ignored',null];}
 ]){
  const c=parse(source()),proto=Object.values(target(c).blocks).find(b=>b.opcode==='procedures_prototype');change(proto);
  assert.throws(()=>validateProcedureParameterConstraints(c.project),/prototype|formal/);
  assert.throws(()=>c.decompile(),/Procedure parameter constraint/);
 }
});
test('constrained call cannot discard an extra connected effect or borrow a foreign argument parent',()=>{
 const code=source()+'WHEN flag clicked:\n  holdText ("ok")\n';
 const c=parse(code),t=target(c),[id,call]=Object.entries(t.blocks).find(([,b])=>b.opcode==='procedures_call');
 call.inputs.EXTRA=[3,'hiddenEffect',[10,'']];t.blocks.hiddenEffect={opcode:'arcade_callFunction',parent:id,next:null,inputs:{NAME:[1,[10,'sideEffect']],ARGS:[1,[10,'[]']]},fields:{},shadow:false,topLevel:false};
 assert.throws(()=>validateProcedureParameterConstraints(c.project),/formal IDs/);assert.throws(()=>c.decompile(),/formal IDs/);
 const foreign=parse(code),ft=target(foreign),[fid,fc]=Object.entries(ft.blocks).find(([,b])=>b.opcode==='procedures_call'),arg=JSON.parse(fc.mutation.argumentids)[0];
 ft.blocks.foreignValue={opcode:'arcade_getLocal',parent:'otherCaller',next:null,inputs:{NAME:[1,[10,'value']]},fields:{},shadow:false,topLevel:false};fc.inputs[arg]=[3,'foreignValue',[10,'']];
 assert.notEqual(fid,'otherCaller');assert.throws(()=>foreign.decompile(),/parent ownership/);
});
test('actual constrained definition, reporter and body ownership is complete and finite',()=>{
 for(const change of [
  (t,def,proto)=>{def.inputs.EXTRA=[1,[10,'ignored']];},
  (t,def,proto)=>{const id=JSON.parse(proto.mutation.argumentids)[0];t.blocks[proto.inputs[id][1]].inputs.EXTRA=[1,[10,'ignored']];},
  (t,def)=>{const first=t.blocks[def.next];first.next=def.next;},
  (t,def)=>{t.blocks[def.next].next='missingBody';}
 ]){
  const c=parse(source()),t=target(c),def=Object.values(t.blocks).find(b=>b.opcode==='procedures_definition'),proto=t.blocks[def.inputs.custom_block[1]];change(t,def,proto);
  assert.throws(()=>c.decompile(),/Procedure parameter constraint/);
 }
 const healthy=parse(source()+'WHEN flag clicked:\n  holdText ("ok")\n');assert.equal(parse(healthy.decompile()).decompile(),healthy.decompile());
});
test('unconstrained legacy call shapes remain outside the new protocol validator',()=>{
 const c=parse(header+'DEFINE old (value):\n  arcade log value\nWHEN flag clicked:\n  old ("ok")\n'),t=target(c),call=Object.values(t.blocks).find(b=>b.opcode==='procedures_call');
 call.inputs.EXTRA=[1,[10,'legacy']];assert.doesNotThrow(()=>validateProcedureParameterConstraints(c.project));
});
