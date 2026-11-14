import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import Creator from '../src/utils/sb3Creator.js';
test('high score reporter has an empty schema through Code and fresh SB3',async()=>{
 const first=new Creator();first.parse('DEVICE ARCADE\nSPRITE Game:\nWHEN arcade source starts:\n  set best to (arcade high score)\n');assert.deepEqual(first.warnings,[]);
 const check=project=>{const blocks=project.targets.flatMap(t=>Object.values(t.blocks)),found=blocks.filter(b=>b.opcode==='arcade_highScore');assert.equal(found.length,1);assert.deepEqual(found[0].inputs,{});};check(first.project);
 const code=first.decompile(),again=new Creator();again.parse(code);check(again.project);assert.equal(again.decompile(),code);
 const zip=await JSZip.loadAsync(await(await first.generateSB3()).arrayBuffer()),fresh=new Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));check(fresh.project);assert.equal(fresh.decompile(),code);
});
