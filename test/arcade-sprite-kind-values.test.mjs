import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';

const source=`DEVICE ARCADE
SPRITE Game:
WHEN flag clicked:
  arcade initialize sprite kind library "textsprite" version "v1.3.0"
  arcade bind sprite kind name "Extra" to (arcade create sprite kind)
  arcade bind sprite kind name "Custom" to (1000 + 7)
  set dynamic to (arcade create image canvas template "Sprite" kind (arcade create sprite kind))
  set named to (arcade create image canvas template "Sprite" kind "Player")
  set literal to (arcade create image canvas template "Sprite" kind 1002)
  set lookup to (arcade create image canvas template "Sprite" kind (arcade sprite kind value "Text"))
  set arithmetic to ((arcade sprite kind value "Player") + 1)
  IF (arcade sprite kind value "Text") = (arcade sprite kind value "Player") THEN:
    hide`;

function inspect(creator){
 assert.deepEqual(creator.warnings,[]);
 const blocks=creator.project.targets.find(t=>t.name==='Game').blocks;
 const values=Object.values(blocks);
 const library=values.find(b=>b.opcode==='arcade_initializeSpriteKindLibrary');
 assert.equal(library.inputs.LIBRARY[1][1],'textsprite');assert.equal(library.inputs.VERSION[1][1],'v1.3.0');
 const bindings=values.filter(b=>b.opcode==='arcade_bindSpriteKind');assert.equal(bindings.length,2);
 const declared=bindings.find(b=>b.inputs.NAME[1][1]==='Extra');
 assert.equal(blocks[declared.inputs.KIND[1]].opcode,'arcade_createSpriteKind');
 const computed=bindings.find(b=>b.inputs.NAME[1][1]==='Custom');
 const numeric=blocks[computed.inputs.KIND[1]];assert.equal(numeric.opcode,'operator_add');
 assert.deepEqual(numeric.inputs.NUM1,[1,[4,'1000']]);assert.deepEqual(numeric.inputs.NUM2,[1,[4,'7']]);
 const sprites=values.filter(b=>b.opcode==='arcade_createImageSprite');assert.equal(sprites.length,4);
 assert.equal(sprites.filter(b=>typeof b.inputs.KIND[1]==='string' && blocks[b.inputs.KIND[1]].opcode==='arcade_createSpriteKind').length,1);
 assert.ok(sprites.some(b=>JSON.stringify(b.inputs.KIND)==='[1,[10,"Player"]]'),'legacy kind label is a text shadow');
 assert.ok(sprites.some(b=>JSON.stringify(b.inputs.KIND)==='[1,[4,"1002"]]'),'numeric literal retains its numeric shadow');
 const lookup=sprites.find(b=>typeof b.inputs.KIND[1]==='string' && blocks[b.inputs.KIND[1]].opcode==='arcade_spriteKindValue');
 assert.equal(blocks[lookup.inputs.KIND[1]].inputs.NAME[1][1],'Text');
 const addition=values.find(b=>b.opcode==='operator_add' && typeof b.inputs.NUM1[1]==='string' && blocks[b.inputs.NUM1[1]].opcode==='arcade_spriteKindValue');
 assert.ok(addition,'named kind value connects to numeric arithmetic');
 assert.equal(blocks[addition.inputs.NUM1[1]].inputs.NAME[1][1],'Player');
 const comparison=values.find(b=>b.opcode==='operator_equals');
 assert.equal(blocks[comparison.inputs.OPERAND1[1]].opcode,'arcade_spriteKindValue');
 assert.equal(blocks[comparison.inputs.OPERAND2[1]].opcode,'arcade_spriteKindValue');
 assert.equal(values.filter(b=>b.opcode==='arcade_spriteKindValue').length,4,'lookup does not become an allocator');
 return blocks;
}

test('kind allocation/library words and numeric existing KIND inputs retain values through Code and fresh SB3',async()=>{
 const creator=new SB3Creator();creator.parse(source);const blocks=inspect(creator);
 const code=creator.decompile();const reparsed=new SB3Creator();reparsed.parse(code);inspect(reparsed);assert.equal(reparsed.decompile(),code);
 const zip=await JSZip.loadAsync(await(await creator.generateSB3()).arrayBuffer());
 const project=JSON.parse(await zip.file('project.json').async('string'));
 const fresh=new SB3Creator();fresh.project=project;
 assert.deepEqual(inspect(fresh),blocks,'archive preserves connected numeric reporters and literal kinds exactly');
 assert.equal(fresh.decompile(),code);
});
