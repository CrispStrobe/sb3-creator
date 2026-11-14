import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
const source=`DEVICE ARCADE
SPRITE Game:
WHEN arcade source starts:
  set limited to (arcade ask number ("Question?") length (1 + 2))
  set original to (arcade ask number ("Default?"))
`;
function inspect(project){
 const blocks=Object.fromEntries(project.targets.flatMap(target=>Object.entries(target.blocks)));
 const prompt=Object.values(blocks).filter(block=>block.opcode==='arcade_askForNumberLength');assert.equal(prompt.length,1);
 assert.deepEqual(prompt[0].inputs.QUESTION,[1,[10,'Question?']]);
 assert.equal(blocks[prompt[0].inputs.LENGTH[1]].opcode,'operator_add');
 assert.equal(Object.values(blocks).filter(block=>block.opcode==='arcade_askForNumber').length,1);
}
test('bounded number prompt keeps distinct inputs and default reporter through Code and fresh SB3',async()=>{
 const first=new SB3Creator();first.parse(source);assert.deepEqual(first.warnings,[]);inspect(first.project);
 const code=first.decompile(),again=new SB3Creator();again.parse(code);assert.deepEqual(again.warnings,[]);inspect(again.project);
 const zip=await JSZip.loadAsync(await(await first.generateSB3()).arrayBuffer()),fresh=new SB3Creator();
 fresh.project=JSON.parse(await zip.file('project.json').async('text'));inspect(fresh.project);assert.equal(fresh.decompile(),code);
});
