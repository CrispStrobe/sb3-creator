import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
test('multiplayer player values retain lookup mode, reference inputs and member-read mode through Blocks roundtrips',()=>{
 const code=`DEVICE arcade
WHEN flag clicked:
  set player to (arcade player by index (1 + 1))
  set all to (arcade all players)
  arcade move player (player) with buttons vx (60) vy (0)
  arcade set sprite of player (player) to (actor)
  set sprite to (arcade sprite of player (player))
  set owner to (arcade player of sprite (sprite))
  set index to (arcade player member property (1) of (player))
  set number to (arcade player safe property (2) of (owner))`;
 const first=new SB3Creator(),project=first.parse(code);
 const blocks=project.targets.flatMap(t=>Object.values(t.blocks));
 const lookup=blocks.find(b=>b.opcode==='arcade_playerLookup');assert.equal(lookup.fields.MODE[0],'index');
 const reads=blocks.filter(b=>b.opcode==='arcade_playerProperty');assert.deepEqual(reads.map(b=>b.fields.READ[0]),['member','safe']);
 const output=first.decompile();const second=new SB3Creator();second.parse(output);
 assert.equal(second.decompile(),output);
 for(const opcode of ['movePlayerWithButtons','playerLookup','allPlayers','setPlayerSprite','playerSprite','playerBySprite','playerProperty'])assert.ok(blocks.some(b=>b.opcode==='arcade_'+opcode),opcode);
});
