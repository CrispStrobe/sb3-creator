import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
test('color wall registration, callback and obstacle reporter roundtrip natively',()=>{
 const c=new SB3Creator();c.parse(`DEVICE arcade
WHEN flag clicked:
  arcade register color wall kind "Player" index (2) as "hit" capturing "weight"
WHEN arcade color wall handler "hit" runs:
  set index to (arcade sprite (arcade event first) wall hit index (2))`);
 const out=c.decompile(),d=new SB3Creator();d.parse(out);assert.equal(d.decompile(),out);assert.deepEqual(c.warnings,[]);assert.deepEqual(d.warnings,[]);
 for(const op of ['registerLegacyWallHandler','whenRegisteredLegacyWall','tileHitFrom'])assert.ok(c.project.targets.some(t=>Object.values(t.blocks).some(b=>b.opcode==='arcade_'+op)));
});
