import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import Creator from '../src/utils/sb3Creator.js';
import {ARCADE_WORDS} from '../src/utils/arcadeDialect.js';
const header='DEVICE ARCADE\nGLOBAL threshold\nSPRITE Game:\n';
const parse=code=>{const c=new Creator();c.parse(code);assert.deepEqual(c.warnings,[]);return c;};
const target=c=>c.project.targets.find(t=>t.name==='Game');
const registration=c=>Object.values(target(c).blocks).find(b=>b.opcode==='arcade_registerScoreHandler');
const fixed=c=>{const code=c.decompile(),again=parse(code);assert.equal(again.decompile(),code);return code;};
test('score registration and callback keep exact connected schemas and variable threshold through Code and fresh SB3',async()=>{
 const c=parse(header+'WHEN flag clicked:\n  set threshold to 3.5\n  arcade register score player (2) threshold (threshold) as "score1" capturing "threshold"\nWHEN arcade score handler "score1" runs:\n  change threshold by 1\n');
 const row=registration(c),t=target(c);assert.deepEqual(Object.keys(row.inputs).sort(),['CAPTURES','PLAYER','SCORE','TOKEN']);assert.deepEqual(row.fields,{});
 const operand=row.inputs.SCORE[1];assert.equal(Array.isArray(operand)?operand[0]===12:t.blocks[operand]?.opcode==='data_variable',true,'actual variable connection');
 const hat=Object.values(t.blocks).find(b=>b.opcode==='arcade_whenRegisteredScore');assert.deepEqual(Object.keys(hat.inputs),['TOKEN']);
 assert.equal(ARCADE_WORDS.filter(w=>w.op==='arcade_registerScoreHandler').length,1);assert.equal(ARCADE_WORDS.filter(w=>w.op==='arcade_whenRegisteredScore').length,1);
 const code=fixed(c),zip=await JSZip.loadAsync(await(await c.generateSB3()).arrayBuffer());
 const fresh=new Creator();fresh.project=JSON.parse(await zip.file('project.json').async('text'));assert.equal(fresh.decompile(),code);assert.equal(fixed(fresh),code);
});
test('current fractional, player, token, capture and text edits survive without syntax coercion or hidden aliases',()=>{
 const c=parse(header+'WHEN flag clicked:\n  arcade register score player 1 threshold 3.5 as "score1" capturing ""\nWHEN arcade score handler "score1" runs:\n  hide\n'),row=registration(c);
 row.inputs.PLAYER=[1,[4,'4']];row.inputs.SCORE=[1,[4,'7.5']];row.inputs.TOKEN=[1,[10,'score2']];row.inputs.CAPTURES=[1,[10,'threshold']];
 const hat=Object.values(target(c).blocks).find(b=>b.opcode==='arcade_whenRegisteredScore');hat.inputs.TOKEN=[1,[10,'score2']];
 const numeric=fixed(c);assert.match(numeric,/player 4 threshold 7\.5 as "score2" capturing "threshold"/);
 row.inputs.SCORE=[1,[10,'2']];const text=fixed(c);assert.match(text,/threshold "2"/,'text remains text; consumer domain proof is separate');
});
