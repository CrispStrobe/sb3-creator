import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';

const source=`DEVICE ARCADE
GLOBAL owner
SPRITE Game:
WHEN arcade source starts:
  set owner to (arcade current scene)
  arcade scene (owner) set flags to (calculate value (arcade flags of scene (owner)) op "|" with (2))
  arcade set user controller events enabled (compare value (arcade flags of scene (arcade current scene)) op ">" with (0))
  set mask to ((arcade flags of scene (owner)) + (4))
`;
function inspect(creator) {
    assert.deepEqual(creator.warnings,[]);
    const entries=creator.project.targets.flatMap(target=>Object.entries(target.blocks)),blocks=Object.fromEntries(entries);
    const set=entries.find(([,b])=>b.opcode==='arcade_setSceneFlags')[1];
    assert.equal(blocks[set.inputs.VALUE[1]].opcode,'arrays_valueBinary');
    assert.equal(blocks[blocks[set.inputs.VALUE[1]].inputs.LEFT[1]].opcode,'arcade_sceneFlags');
    const gate=entries.find(([,b])=>b.opcode==='arcade_setUserEventsEnabled')[1];
    assert.equal(blocks[gate.inputs.ENABLED[1]].opcode,'arrays_valueCompare');
    const current=entries.filter(([,b])=>b.opcode==='arcade_currentScene');assert.equal(current.length,2);
    assert.ok(entries.some(([,b])=>b.opcode==='operator_add' && blocks[b.inputs.NUM1[1]].opcode==='arcade_sceneFlags'));
    return creator.project;
}
test('Scene flags and live user-event Boolean inputs retain real nested operands through Code and SB3',async()=>{
    const creator=new SB3Creator();creator.parse(source);inspect(creator);
    const code=creator.decompile(),second=new SB3Creator();second.parse(code);inspect(second);assert.equal(second.decompile(),code);
    const zip=await JSZip.loadAsync(await(await creator.generateSB3()).arrayBuffer()),fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));
    inspect(fresh);assert.equal(fresh.decompile(),code);
});
