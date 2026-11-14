import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import Creator from '../src/utils/sb3Creator.js';
test('game reset is a distinct empty-input command through Code and fresh SB3',async()=>{
 const first=new Creator();first.parse('DEVICE ARCADE\nSPRITE Game:\nWHEN arcade source starts:\n  arcade reset game\n');assert.deepEqual(first.warnings,[]);
 const check=project=>{const rows=project.targets.flatMap(t=>Object.values(t.blocks)).filter(b=>b.opcode==='arcade_resetGame');assert.equal(rows.length,1);assert.deepEqual(rows[0].inputs,{});};check(first.project);
 const code=first.decompile(),again=new Creator();again.parse(code);check(again.project);assert.equal(again.decompile(),code);
 const zip=await JSZip.loadAsync(await(await first.generateSB3()).arrayBuffer()),fresh=new Creator();fresh.project=JSON.parse(await zip.file('project.json').async('string'));check(fresh.project);assert.equal(fresh.decompile(),code);
});
