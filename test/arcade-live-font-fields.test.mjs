import test from 'node:test';
import assert from 'node:assert/strict';
import Creator from '../src/utils/sb3Creator.js';

test('live Font references connect factories, scaling and printing through Code and saved blocks',async()=>{
 const creator=new Creator();
 creator.parse(`DEVICE ARCADE
GLOBAL selectedFont
SPRITE Game:
WHEN flag clicked:
  set selectedFont to (arcade scaled font (arcade font for text "漢") by (1 + 1))
  arcade print "hello" on image (arcade screen image) x 1 y 2 color 17 using font (selectedFont)
  arcade print centered "hello" on image (arcade screen image) y 2 color 17 using font (arcade font value font5)`);
 assert.deepEqual(creator.warnings,[]);
 const blocks=creator.project.targets.flatMap(target=>Object.values(target.blocks));
 const constant=blocks.find(block=>block.opcode==='arcade_fontValue');
 assert.deepEqual(constant.fields.FONT,['font5',null]);assert.equal(constant.inputs.FONT,undefined);
 for(const opcode of ['arcade_scaleFont','arcade_printImageFont','arcade_printImageFontCenter']){
  const block=blocks.find(block=>block.opcode===opcode);assert.ok(block,opcode);
  assert.ok(block.inputs.FONT,opcode+' needs a connected value');assert.equal(block.fields.FONT,undefined);
 }
 assert.ok(blocks.find(block=>block.opcode==='arcade_fontForText').inputs.TEXT);
 assert.ok(blocks.find(block=>block.opcode==='arcade_scaleFont').inputs.SIZE);
 const replay=new Creator();replay.parse(creator.decompile());assert.deepEqual(replay.warnings,[]);
 const again=replay.project.targets.flatMap(target=>Object.values(target.blocks));
 for(const opcode of ['arcade_fontValue','arcade_fontForText','arcade_scaleFont','arcade_printImageFont','arcade_printImageFontCenter'])
  assert.equal(again.filter(block=>block.opcode===opcode).length,1,opcode);
 const saved=await creator.generateSB3();assert.ok(saved.size>0);
});

test('a fixed Font factory refuses computed and unknown selectors',()=>{
 for(const value of ['(fontName)','unknown']){
  const creator=new Creator();assert.throws(()=>creator.parse('DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  set selected to (arcade font value '+value+')'),error=>error.code==='DIALECT_UNPARSED_LINES');
 }
});

test('the fixed print selector keeps its field when live printing is added',()=>{
 const creator=new Creator();creator.parse('DEVICE ARCADE\nSPRITE Game:\nWHEN flag clicked:\n  arcade print "hello" on image (arcade screen image) x 1 y 2 color 1 font small');
 assert.deepEqual(creator.warnings,[]);
 const block=creator.project.targets.flatMap(target=>Object.values(target.blocks)).find(block=>block.opcode==='arcade_printImageText');
 assert.ok(block);assert.equal(block.fields.FONT[0],'small');assert.equal(block.inputs.FONT,undefined);
});
