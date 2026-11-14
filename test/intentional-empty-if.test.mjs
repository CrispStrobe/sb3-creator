import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import JSZip from 'jszip';
const parse=body=>{const c=new SB3Creator();c.parse('SPRITE Game:\nWHEN flag clicked:\n'+body);return c;};
const blocks=c=>c.project.targets.flatMap(target=>Object.entries(target.blocks).map(([id,b])=>({id,...b})));
test('explicit branch PASS creates the actual empty substack and survives Code and SB3',async()=>{
 const c=parse('  IF (1) = (1) THEN:\n    PASS\n  ELSE:\n    PASS\n  set after to (3)');assert.deepEqual(c.warnings,[]);const b=blocks(c).find(b=>b.opcode==='control_if_else');assert.ok(b);assert.equal(b.inputs.SUBSTACK,undefined);assert.equal(b.inputs.SUBSTACK2,undefined);assert.ok(b.next);assert.equal(blocks(c).filter(b=>b.opcode==='data_setvariableto').length,1);
 const code=c.decompile();assert.equal((code.match(/PASS/g)||[]).length,2);const d=new SB3Creator();d.parse(code);assert.deepEqual(d.warnings,[]);
 const zip=await JSZip.loadAsync(await(await c.generateSB3()).arrayBuffer()),project=JSON.parse(await zip.file('project.json').async('string'));const saved=project.targets.flatMap(t=>Object.values(t.blocks)).find(b=>b.opcode==='control_if_else');assert.equal(saved.inputs.SUBSTACK,undefined);assert.equal(saved.inputs.SUBSTACK2,undefined);
});
test('nested ELSE and later siblings retain their own linkage with mixed PASS and commands',()=>{
 const c=parse('  IF (1) = (1) THEN:\n    IF (0) = (1) THEN:\n      PASS\n    ELSE:\n      PASS\n      set inner to (2)\n  ELSE:\n    PASS\n  set after to (4)');assert.deepEqual(c.warnings,[]);const all=blocks(c),ifs=all.filter(b=>b.opcode==='control_if_else');assert.equal(ifs.length,2);const outer=ifs.find(b=>b.parent&&all.find(p=>p.id===b.parent)?.opcode!=='control_if_else')||ifs.find(b=>b.inputs.SUBSTACK);const inner=all.find(b=>b.id===outer.inputs.SUBSTACK[1]);assert.equal(inner.opcode,'control_if_else');assert.equal(inner.parent,outer.id);assert.ok(inner.inputs.SUBSTACK2);assert.ok(outer.next);assert.equal(all.find(b=>b.id===outer.next).opcode,'data_setvariableto');const again=new SB3Creator();again.parse(c.decompile());assert.deepEqual(again.warnings,[]);
});
test('missing or comment-only branches still warn; PASS in another branch cannot acknowledge them',()=>{
 for(const body of ['  IF (1) = (1) THEN:', '  IF (1) = (1) THEN:\n    # no statement', '  IF (1) = (1) THEN:\n  ELSE:\n    PASS', '  IF (1) = (1) THEN:\n    PASS\n  ELSE:\n    # no statement']){const c=parse(body);assert.ok(c.warnings.some(w=>w.includes('Empty body')))}
});
test('PASS is not a general procedure, hat or loop no-op; unknown and malformed branches fail',()=>{
 for(const body of ['  PASS','  FOREVER:\n    PASS','  REPEAT (2):\n    PASS','  IF (1) = (1) THEN:\n    PASSS','  IF (1) = (1) THEN:\n    PASS()','  ELSE:\n    PASS'])assert.throws(()=>parse(body));
 const c=new SB3Creator();assert.throws(()=>c.parse('SPRITE Game:\nDEFINE empty:\n  PASS'));
});
