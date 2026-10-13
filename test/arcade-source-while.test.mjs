import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';

const parse = text => {const c=new SB3Creator();c.parse(text);return c;};
const blocks = c => c.project.targets.flatMap(t=>Object.entries(t.blocks).map(([id,b])=>({...b,id})));
const source = `GLOBAL n
SPRITE Game:
WHEN flag clicked:
  set n to 0
  arcade repeat while (n < 5):
    change n by 1
    arcade set background color to n
  set n to 10`;

test('source while owns Boolean condition, child body and following stack connection',()=>{
 const c=parse(source),all=blocks(c),loop=all.find(b=>b.opcode==='arcade_sourceWhile');
 assert.deepEqual(c.warnings,[]);
 assert.equal(all.find(b=>b.id===loop.inputs.CONDITION[1]).opcode,'operator_lt');
 assert.equal(all.find(b=>b.id===loop.inputs.CONDITION[1]).parent,loop.id);
 const child=all.find(b=>b.id===loop.inputs.SUBSTACK[1]);
 assert.equal(child.opcode,'data_changevariableby');assert.equal(child.parent,loop.id);
 assert.equal(all.find(b=>b.id===child.next).opcode,'arcade_setBackgroundColor');
 assert.equal(all.find(b=>b.id===loop.next).opcode,'data_setvariableto');
 assert.equal(all.find(b=>b.id===loop.next).parent,loop.id);
 const d=c.decompile();assert.match(d,/arcade repeat while/);assert.equal(parse(d).decompile(),d);
});
test('source and ordinary nested loops remain distinct through Code and fresh SB3',async()=>{
 const c=parse(`SPRITE Game:
WHEN flag clicked:
  REPEAT 2:
    arcade repeat while (n < 5):
      REPEAT UNTIL (n > 3):
        change n by 1
      arcade repeat while (n < 2):
        change n by 1
  FOREVER:
    arcade set background color to 0`);
 assert.deepEqual(c.warnings,[]);
 const wanted=['control_repeat','arcade_sourceWhile','control_repeat_until','arcade_sourceWhile','control_forever'];
 assert.deepEqual(blocks(c).filter(b=>wanted.includes(b.opcode)).map(b=>b.opcode).sort(),wanted.sort());
 const d=c.decompile();assert.equal(parse(d).decompile(),d);
 const zip=await JSZip.loadAsync(await (await c.generateSB3()).arrayBuffer());
 const project=JSON.parse(await zip.file('project.json').async('string'));
 const all=project.targets.flatMap(t=>Object.entries(t.blocks).map(([id,b])=>({...b,id})));
 assert.equal(all.filter(b=>b.opcode==='arcade_sourceWhile').length,2);
 for(const loop of all.filter(b=>b.opcode==='arcade_sourceWhile')){
  assert.equal(loop.inputs.CONDITION[0],2);assert.equal(loop.inputs.SUBSTACK[0],2);
  assert.equal(all.find(b=>b.id===loop.inputs.SUBSTACK[1]).parent,loop.id);
  assert.equal(loop.mutation,undefined,'no hidden origin mutation');
 }
 assert.ok(project.extensions.includes('arcade'));
});
test('literal Boolean slots are real connected Boolean blocks',()=>{
 for(const value of [0,1]){
  const c=parse(`SPRITE Game:\nWHEN flag clicked:\n  arcade repeat while ${value}:\n    hide`);
  const all=blocks(c),loop=all.find(b=>b.opcode==='arcade_sourceWhile');
  assert.equal(all.find(b=>b.id===loop.inputs.CONDITION[1]).opcode,'operator_equals');
  assert.equal(parse(c.decompile()).decompile(),c.decompile());
 }
});
test('a loop without its body header is refused, and break/continue are not silently consumed',()=>{
 for(const line of ['arcade repeat while 1','break','continue']){
  const c=new SB3Creator();
  assert.throws(()=>c.parse(`SPRITE Game:\nWHEN flag clicked:\n  ${line}`));
 }
});
