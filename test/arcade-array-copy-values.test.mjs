import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';

const source=`DEVICE ARCADE
GLOBAL original
SPRITE Game:
WHEN arcade source starts:
  set original to (new array reference from (array value (1) rest (array value (2) rest ("[]"))))
  set copy to (slice array reference (original) from (-0.5) to (undefined value))
  set joined to (concatenate array reference (original) with (slice array reference (original) from (1) to (undefined value)))
  set unit to (char code of text ("😀A") at (calculate value (1) op "+" with (0)))
`;
const inspect=creator=>{
  assert.deepEqual(creator.warnings,[]);
  const blocks=creator.project.targets.flatMap(target=>Object.values(target.blocks));
  const slices=blocks.filter(block=>block.opcode==='arrays_referenceSlice');
  assert.equal(slices.length,2);
  const lookup=Object.fromEntries(creator.project.targets.flatMap(target=>Object.entries(target.blocks)));
  for(const block of slices)assert.equal(lookup[block.inputs.END[1]].opcode,'arrays_specialValue');
  const concat=blocks.find(block=>block.opcode==='arrays_referenceConcat');
  assert.equal(lookup[concat.inputs.OTHER[1]].opcode,'arrays_referenceSlice');
  const character=blocks.find(block=>block.opcode==='arrays_stringCharCodeAt');
  assert.equal(lookup[character.inputs.INDEX[1]].opcode,'arrays_valueBinary');
  return blocks;
};

test('fresh copy and UTF16 words retain typed operands through Code and actual SB3',async()=>{
  const creator=new SB3Creator();creator.parse(source);inspect(creator);
  const code=creator.decompile(),again=new SB3Creator();again.parse(code);inspect(again);
  assert.equal(again.decompile(),code);
  const zip=await JSZip.loadAsync(await(await creator.generateSB3()).arrayBuffer());
  const fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));
  assert.deepEqual(inspect(fresh),inspect(creator));assert.equal(fresh.decompile(),code);
});
