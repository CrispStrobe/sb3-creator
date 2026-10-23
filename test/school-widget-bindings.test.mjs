import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {requireSiblings,siblingGuardTest,locate} from './helpers/siblings.mjs';
import {injectEngine} from '../scripts/lib/engine-surface.mjs';
const gate=requireSiblings('bw-board','bw-circuit-ui');
siblingGuardTest(gate,'school Widgets and battery circuits');
let ControllerPanel,ControllerExtension,bindPanelToBoard,Circuit;
if(!gate.skip){
 const board=locate('bw-board').path,cui=locate('bw-circuit-ui').path;
 await injectEngine({board,cui});
 ({ControllerPanel}=await import(pathToFileURL(path.join(board,'src/controller.js'))));
 ({ControllerExtension}=await import(pathToFileURL(path.join(board,'src/controller-extension.js'))));
 ({bindPanelToBoard}=await import(pathToFileURL(path.join(board,'src/controller-binding.js'))));
 ({Circuit}=await import(pathToFileURL(path.join(cui,'src/model/circuit.js'))));
}
const examples=new URL('../examples/',import.meta.url);
const json=file=>JSON.parse(readFileSync(new URL(file,examples)));

test('the shipped faceplate drives the real eight switch/trimmer branches through the existing Controller extension', {skip:gate.skip},()=>{
 const model=Circuit.fromJSON(json('school-miniorgan-107056/circuit.json'));
 const layout=json('school-miniorgan-107056/controller.json');
 const panel=ControllerPanel.fromJSON(layout),ext=new ControllerExtension();ext.setPanel(panel);
 const binding=bindPanelToBoard(panel,model.board);
 try{
  binding.sync();
  assert.equal(panel.mode,'play');
  assert.equal(new Set(panel.getWidgets().filter(w=>w.type==='button').map(w=>w.config.key)).size,8);
  for(let i=1;i<=8;i++){
   const key=panel.getWidget('key'+i),trim=panel.getWidget('trim'+i);
   assert.equal(model.parts.find(p=>p.id===key.binding.partId).label,'Key'+i);
   assert.equal(model.parts.find(p=>p.id===trim.binding.partId).label,'Trim'+i);
   assert.equal(model.board.getControl(trim.binding.partId),trim.config.value);
   ext.setWidget({NAME:'key'+i,VALUE:1});
   assert.equal(model.board.getControl(key.binding.partId),1);
   assert.equal(ext.controllerPressed({NAME:'key'+i}),true);
   ext.setWidget({NAME:'key'+i,VALUE:0});
   assert.equal(model.board.getControl(key.binding.partId),0);
   ext.setWidget({NAME:'trim'+i,VALUE:0.25});
   assert.equal(model.board.getControl(trim.binding.partId),0.25);
   assert.equal(ext.controllerValue({NAME:'trim'+i}),0.25);
  }
 }finally{binding.dispose();}
});

test('all saved AA variants preserve physical topology, survive the Circuit serializer and obey shared-arm KCL', {skip:gate.skip},()=>{
 const original=json('school-led-people-dog/circuit.json');
 for(const [slug,volts,ohms] of [['3aa-220',4.5,220],['3nimh',3.6,220],['2aa',3,100],['2nimh',2.4,100]]){
  const data=json('school-led-people-dog/circuit-'+slug+'.json');
  assert.deepEqual(data.wires,original.wires);assert.deepEqual(data.holeWires,original.holeWires);
  const c=Circuit.fromJSON(data);c.advanceTo(25_000_000n);
  const restored=Circuit.fromJSON(c.toJSON());
  assert.equal(c.vcc,volts);assert.equal(restored.vcc,volts);assert.equal(restored.parts.find(p=>p.label==='R1').limits.powerWatts,0.25);
  const part=label=>c.parts.find(p=>p.label===label);
  const current=label=>Math.abs(c.board.branchCurrent(part(label).id,'a'));
  const resistors=c.parts.filter(p=>p.kind==='resistor');assert.equal(resistors.length,15);
  for(const p of resistors){assert.equal(p.params.ohms,ohms);assert.equal(p.limits.powerWatts,0.25);}
  assert.ok(current('R4')<1e-12);
  assert.ok(Math.abs(current('R9')-current('R8')-current('R10'))<1e-9);
  assert.ok(Math.abs(current('R1')-current('R2'))<1e-9);
  assert.ok(current('R5')>0 && current('R8')>0 && current('R10')>0);
  // The engine automatically selects a junction law at low headroom. Use
  // measured LED drops, then independently solve only the resistor network.
  const voltageAt=(p,terminal)=>c.board.nodeVoltage(c.board.getNets().find(n=>n.terminals.some(t=>t.part===p.id&&t.terminal===terminal)).id);
  const ledDrop=label=>voltageAt(part(label),'anode')-voltageAt(part(label),'cathode');
  const red=ledDrop('D2'),green=ledDrop('D3');
  const ux=(volts/ohms+red/(1.5*ohms)+green/(1.375*ohms))/(1/ohms+1/(1.5*ohms)+1/(1.375*ohms));
  assert.ok(Math.abs(current('R8')-(ux-red)/(1.5*ohms))<1e-8);
  assert.ok(Math.abs(current('R10')-(ux-green)/(1.375*ohms))<1e-8);
 }
});
