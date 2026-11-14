import test from 'node:test';
import assert from 'node:assert/strict';
import Creator from '../src/utils/sb3Creator.js';
import JSZip from 'jszip';
const code='DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  arcade register player (3) button "B" event (2048) as "release" capturing ""\nWHEN arcade button handler "release" runs:\n  set total to 7';
test('player button word retains a separate registration opcode and the existing callback hat through Code and fresh SB3',async()=>{
 const creator=new Creator();creator.parse(code);assert.deepEqual(creator.warnings,[]);
 const check=c=>{const blocks=c.project.targets.flatMap(t=>Object.values(t.blocks));const row=blocks.find(b=>b.opcode==='arcade_registerPlayerButtonHandler');assert.ok(row);assert.deepEqual(Object.keys(row.inputs).sort(),['BUTTON','CAPTURES','EVENT','PLAYER','TOKEN']);assert.ok(blocks.some(b=>b.opcode==='arcade_whenRegisteredButton'))};check(creator);
 const again=new Creator();again.parse(creator.decompile());assert.deepEqual(again.warnings,[]);check(again);
 const zip=await JSZip.loadAsync(await(await creator.generateSB3()).arrayBuffer()),fresh=new Creator();fresh.project=JSON.parse(await zip.file('project.json').async('string'));check(fresh);
});
