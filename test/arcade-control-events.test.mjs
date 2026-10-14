import test from 'node:test';import assert from 'node:assert/strict';import JSZip from 'jszip';import SB3Creator from '../src/utils/sb3Creator.js';
const source=`DEVICE ARCADE
GLOBAL source value
SPRITE Game:
WHEN arcade source starts:
  set source to (arcade allocate control event source)
  set controllerSource to (arcade controller event source player 2)
  arcade set controller player 2 connected (value)
  set source to 782.5
  set value to 6.5
  arcade register control event source (source) value (value) flags (32) as "event1" capturing ""
  arcade raise control event source (source) value (value)
  arcade wait for control event source (source) value (value)
  arcade register multiplayer connection event (1) as "connect1" capturing ""
WHEN arcade control event handler "event1" runs:
  change value by 1
WHEN arcade multiplayer connection handler "connect1" runs:
  set who to (arcade event player)`;
const inspect=c=>{assert.deepEqual(c.warnings,[]);const t=c.project.targets.find(t=>t.name==='Game');for(const op of ['registerControlEvent','raiseControlEvent','waitControlEvent','registerMultiplayerConnection','whenRegisteredControlEvent','whenRegisteredMultiplayerConnection'])assert.ok(Object.values(t.blocks).some(b=>b.opcode==='arcade_'+op),op);const reg=Object.values(t.blocks).find(b=>b.opcode==='arcade_registerControlEvent');for(const slot of ['SOURCE','VALUE']){const input=reg.inputs[slot][1];assert.equal(typeof input==='string'?t.blocks[input].opcode:(input[0]===12?'data_variable':null),'data_variable');}const setter=Object.values(t.blocks).find(b=>b.opcode==='arcade_setControllerConnected');assert.deepEqual(setter.fields.PLAYER,['2',null]);assert.equal(setter.inputs.PLAYER,undefined);const connected=setter.inputs.CONNECTED[1];assert.equal(typeof connected==='string'?t.blocks[connected].opcode:(connected[0]===12?'data_variable':null),'data_variable');const flags=reg.inputs.FLAGS[1];assert.equal(String(typeof flags==='string'?t.blocks[flags].fields.NUM[0]:flags[1]),'32');};
test('event IDs and inline callback tokens retain live numeric connections through editable Code and fresh SB3',async()=>{const c=new SB3Creator();c.parse(source);inspect(c);const code=c.decompile(),d=new SB3Creator();d.parse(code);inspect(d);assert.equal(d.decompile(),code);const zip=await JSZip.loadAsync(await(await c.generateSB3()).arrayBuffer());const fresh=new SB3Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));inspect(fresh);assert.equal(fresh.decompile(),code);});
