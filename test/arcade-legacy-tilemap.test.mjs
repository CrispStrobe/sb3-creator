import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
test('color-coded map image, scale, index and wall operands survive native Blocks roundtrips',()=>{
 const first=new SB3Creator();const project=first.parse(`DEVICE arcade
WHEN flag clicked:
  arcade set color-coded map image (mapImage) scale (2 + 1)
  arcade set color tile (index) image (tileImage) wall (false)
  set selected to (arcade tile tileSet of (spot))`);
 const blocks=project.targets.flatMap(t=>Object.values(t.blocks));
 for(const opcode of ['arcade_setLegacyTilemap','arcade_setLegacyTile'])assert.ok(blocks.some(b=>b.opcode===opcode));
 const out=first.decompile(),second=new SB3Creator();second.parse(out);assert.equal(second.decompile(),out);assert.deepEqual(first.warnings,[]);assert.deepEqual(second.warnings,[]);
});
