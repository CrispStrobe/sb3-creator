import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
const source='DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  set limited to (arcade clamp minimum -3.5 maximum -1.25 value (arcade math randomRange first (0 + (-5)) second (0 + (0))))';
const check=c=>{assert.deepEqual(c.warnings,[]);const bs=c.project.targets.find(t=>t.name==='Game').blocks,clamp=Object.values(bs).find(b=>b.opcode==='arcade_clampNumber');assert.ok(clamp);assert.deepEqual(Object.keys(clamp.inputs),['MIN','MAX','VALUE']);assert.equal(bs[clamp.inputs.VALUE[1]].opcode,'arcade_mathBinary');return bs;};
test('clamp ordered inputs preserve negative bounds and connected reporters through Code and fresh SB3',async()=>{const first=new SB3Creator();first.parse(source);check(first);const code=first.decompile(),second=new SB3Creator();second.parse(code);check(second);assert.equal(second.decompile(),code);const zip=await JSZip.loadAsync(await(await first.generateSB3()).arrayBuffer()),fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));assert.deepEqual(check(fresh),check(first));assert.equal(fresh.decompile(),code);});
