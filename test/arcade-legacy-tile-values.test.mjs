import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
test('legacy Tile operands and property menus survive native Blocks roundtrips',()=>{
 const first=new SB3Creator();first.parse(`DEVICE arcade
WHEN flag clicked:
  set spot to (arcade color tile column (1) row (2))
  set spots to (arcade color tile array index (3))
  set center to (arcade color tile x of (spot))
  arcade set color tile (spot) index (4)
  arcade place sprite (actor) on color tile (spot)
  arcade place sprite (actor) on random color tile (5)`);
 for(const opcode of ['legacyTileLocation','legacyTilesOfType','legacyTileProperty','setLegacyTileAt','placeOnLegacyTile','placeOnRandomLegacyTile'])assert.ok(first.project.targets.some(t=>Object.values(t.blocks).some(b=>b.opcode==='arcade_'+opcode)),opcode);
 const out=first.decompile(),second=new SB3Creator();second.parse(out);assert.equal(second.decompile(),out);assert.deepEqual(first.warnings,[]);assert.deepEqual(second.warnings,[]);
});
