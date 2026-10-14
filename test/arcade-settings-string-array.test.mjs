import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
const source=`DEVICE ARCADE
SPRITE Game:
WHEN flag clicked:
  arcade write setting ("copy") type StringArray value (arcade read setting ("text") type StringArray)
  set returned to (arcade read setting ("text") type StringArray)`;
const inspect=creator=>{assert.deepEqual(creator.warnings,[]);const t=creator.project.targets.find(t=>t.name==='Game'),bs=t.blocks,write=Object.values(bs).find(b=>b.opcode==='arcade_settingsWrite'),read=bs[write.inputs.VALUE[1]];assert.equal(read.opcode,'arcade_settingsRead');assert.equal(write.fields.TYPE[0],'StringArray');assert.equal(read.fields.TYPE[0],'StringArray');assert.equal(write.inputs.TYPE,undefined);assert.equal(read.inputs.TYPE,undefined);return t;};
test('StringArray fixed Settings menus and connected array values survive Code and actual fresh SB3',async()=>{const creator=new SB3Creator();creator.parse(source);const original=inspect(creator),code=creator.decompile(),again=new SB3Creator();again.parse(code);inspect(again);assert.equal(again.decompile(),code);const zip=await JSZip.loadAsync(await(await creator.generateSB3()).arrayBuffer()),fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));assert.deepEqual(inspect(fresh).blocks,original.blocks);assert.equal(fresh.decompile(),code);});
