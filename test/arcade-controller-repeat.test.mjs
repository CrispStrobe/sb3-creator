import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
const source=`DEVICE ARCADE
GLOBAL delay
SPRITE Game:
WHEN arcade source starts:
  set delay to (arcade player 2 button B repeat property repeatDelay)
  arcade set player 2 button B repeat property repeatInterval to (undefined value)
  arcade set button repeat defaults delay (delay + 1) interval (20 + 10)
`;
function inspect(project){
 const blocks=Object.fromEntries(project.targets.flatMap(t=>Object.entries(t.blocks)));
 for(const b of Object.values(blocks).filter(b=>['arcade_buttonRepeatProperty','arcade_setButtonRepeatProperty'].includes(b.opcode))){
  assert.equal(b.fields.PLAYER[0],'2');assert.equal(b.fields.BUTTON[0],'B');
  assert.ok(['repeatDelay','repeatInterval'].includes(b.fields.PROPERTY[0]));
  for(const name of ['PLAYER','BUTTON','PROPERTY'])assert.equal(b.inputs[name],undefined,'fixed menu is a direct field');
 }
 const write=Object.values(blocks).find(b=>b.opcode==='arcade_setButtonRepeatProperty');
 assert.equal(blocks[write.inputs.VALUE[1]].opcode,'arrays_specialValue');
 assert.equal(blocks[write.inputs.VALUE[1]].fields.KIND[0],'undefined');
 const defaults=Object.values(blocks).find(b=>b.opcode==='arcade_setButtonRepeatDefaults');
 for(const name of ['DELAY','INTERVAL'])assert.equal(blocks[defaults.inputs[name][1]].opcode,'operator_add');
}
test('repeat properties retain fixed fields, typed undefined and connected defaults through Code and fresh SB3',async()=>{
 const first=new SB3Creator();first.parse(source);assert.deepEqual(first.warnings,[]);inspect(first.project);
 const code=first.decompile(),second=new SB3Creator();second.parse(code);assert.deepEqual(second.warnings,[]);inspect(second.project);assert.equal(second.decompile(),code);
 const zip=await JSZip.loadAsync(await(await first.generateSB3()).arrayBuffer()),fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));inspect(fresh.project);assert.equal(fresh.decompile(),code);
});
