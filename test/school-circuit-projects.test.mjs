import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../examples/',import.meta.url);
const ids=['school-miniorgan-107056','school-intercom-101455','school-led-people-dog'];
const load=id=>JSON.parse(fs.readFileSync(new URL(id+'/circuit.json',root)));
const label=(data,name)=>data.parts.find(p=>p.label===name);

test('school circuits are registered once with readable documentation and no MCU program',()=>{
 const index=JSON.parse(fs.readFileSync(new URL('index.json',root)));
 for(const id of ids){
  const entries=index.filter(x=>x.id===id);assert.equal(entries.length,1);assert.equal(entries[0].kind,'circuit');
  for(const file of Object.values(entries[0].files))assert.ok(fs.readFileSync(new URL(file,root)).length>0);
  assert.equal(fs.readFileSync(new URL(id+'/program.bw',root),'utf8').trim(),'# Pure circuit — no MCU');
 }
});

test('all declared wire endpoints belong to actual terminals and identities stay unique',()=>{
 for(const id of ids){const data=load(id),parts=new Map(data.parts.map(p=>[p.id,p]));assert.equal(parts.size,data.parts.length);
  assert.equal(new Set(data.wires.map(w=>w.id)).size,data.wires.length);
  for(const w of data.wires)for(const endpoint of [w.from,w.to]){
   assert.ok(parts.has(endpoint.part),id+': '+endpoint.part);
   assert.ok(parts.get(endpoint.part).terminals.includes(endpoint.terminal),id+': '+endpoint.terminal);
  }
 }
});

test('miniorgan has eight distinct decreasing rheostat settings, keys and actual feedback parts',()=>{
 const d=load(ids[0]);assert.equal(d.parts.filter(p=>p.kind==='button').length,8);
 const positions=Array.from({length:8},(_,i)=>label(d,'Trim'+(i+1)).params.position);
 assert.ok(positions.every((p,i)=>p>0&&p<1&&(!i||p<positions[i-1])));
 assert.equal(label(d,'R1-180k').params.ohms,180000);
 assert.equal(label(d,'C1-3n3').params.farads,3.3e-9);assert.equal(label(d,'C2-10n').params.farads,10e-9);
 for(const name of ['BC548','BC558']){const p=label(d,name);assert.equal(p.params.model,'shockley');assert.ok(p.params.cje>0&&p.params.cjc>0&&p.params.tf>0);}
 assert.deepEqual(label(d,'VCC').params.points,[[0,0],[.00001,9]]);
});

test('intercom keeps both switch poles and both 8-ohm speaker coils',()=>{
 const d=load(ids[1]);assert.equal(d.parts.filter(p=>p.kind==='npn').length,3);
 for(const station of ['A','B']){
  assert.equal(label(d,'DPDT-'+station).kind,'slide_switch');assert.equal(label(d,'DPDT-'+station).params.position,0);
  assert.equal(label(d,'Speaker-'+station+'-8ohm').params.ohms,8);
 }
 assert.equal(label(d,'Acoustic-A').params.amplitude,.001);assert.equal(label(d,'Acoustic-B').params.amplitude,0);
});

test('AA figures retain all fifteen resistors and explicitly open arm and tail',()=>{
 const d=load(ids[2]);assert.equal(d.vcc,4.5);assert.equal(d.parts.filter(p=>p.kind==='resistor').length,15);
 assert.equal(label(d,'R5').params.ohms,470);
 for(const [name,terminal]of [['R4','b'],['Tail','cathode']])assert.equal(d.wires.some(w=>[w.from,w.to].some(e=>e.part===label(d,name).id&&e.terminal===terminal)),false);
});
