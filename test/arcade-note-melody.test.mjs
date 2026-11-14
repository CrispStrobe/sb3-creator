import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';

const source=`DEVICE ARCADE
SPRITE Game:
WHEN arcade source starts:
  arcade play note melody ("C5 - D C") at (180 + 60) bpm
  arcade play melody (arcade melody baDing) mode playUntilDone
`;
function inspect(project) {
    const blocks=Object.fromEntries(project.targets.flatMap(target=>Object.entries(target.blocks)));
    const legacy=Object.values(blocks).filter(block=>block.opcode==='arcade_playNoteMelody');
    assert.equal(legacy.length,1);
    assert.deepEqual(legacy[0].inputs.NOTES,[1,[10,'C5 - D C']]);
    assert.equal(blocks[legacy[0].inputs.TEMPO[1]].opcode,'operator_add');
    assert.equal(Object.values(blocks).filter(block=>block.opcode==='arcade_playMelody').length,1,'existing Melody-handle command remains distinct');
}

test('legacy note melody has a distinct command with preserved arguments through Code and fresh SB3',async()=>{
    const first=new SB3Creator();first.parse(source);assert.deepEqual(first.warnings,[]);inspect(first.project);
    const code=first.decompile(),second=new SB3Creator();second.parse(code);assert.deepEqual(second.warnings,[]);inspect(second.project);
    assert.equal(second.decompile(),code);
    const zip=await JSZip.loadAsync(await(await first.generateSB3()).arrayBuffer()),fresh=new SB3Creator();
    fresh.project=JSON.parse(await zip.file('project.json').async('text'));inspect(fresh.project);assert.equal(fresh.decompile(),code);
});
