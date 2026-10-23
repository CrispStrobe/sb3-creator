import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
const source = `WHEN flag clicked:
  set widget "key1" to 1
  set widget "trim1" to 0.48339895
  set pitch to widget value "trim1"
  set horizontal to widget x "joystick"
  set vertical to widget y "joystick"
  IF widget pressed "key1" THEN:
    set widget "key1" to 0
`;
const parse = text => {const c = new SB3Creator(); c.parse(text); return c;};

test('Widgets pseudocode produces actual controller commands and reporters, including the Boolean condition', () => {
 const c = parse(source);
 const blocks = Object.values(c.project.targets.flatMap(t => Object.values(t.blocks)));
 for (const opcode of ['setWidget','controllerValue','controllerX','controllerY','controllerPressed']) {
  assert.ok(blocks.some(b => b.opcode === 'controller_'+opcode), opcode);
 }
 assert.equal(blocks.filter(b => b.opcode === 'controller_setWidget').length, 3);
 assert.ok(c.project.extensions.includes('controller'));
 assert.ok(!c.project.extensionURLs?.controller, 'built-in Widgets must not load an invented remote extension');
 const back = new SB3Creator().decompile(c.project);
 assert.match(back, /widget pressed "key1"/);
 assert.match(back, /set widget "trim1" to 0\.48339895/);
 assert.equal(new SB3Creator().decompile(parse(back).project), back);
});

test('named Widgets emit real controller driver calls in JavaScript and Python', () => {
 for (const emit of ['generateJavaScript','generatePython']) {
  const result = String(parse(source)[emit]());
  assert.match(result, /_controller\.setWidget\("key1", 1\)/);
  assert.match(result, /_controller\.controllerValue\("trim1"\)/);
  assert.match(result, /_controller\.controllerPressed\("key1"\)/);
  assert.match(result, /_controller\.controllerX\("joystick"\)/);
  assert.match(result, /_controller\.controllerY\("joystick"\)/);
 }
});

test('widget names containing to are kept as one quoted name and values remain expressions', () => {
 const c = parse('WHEN flag clicked:\n  set widget "key to play" to (widget value "trim1") + 1\n');
 const back = new SB3Creator().decompile(c.project);
 assert.match(back, /set widget "key to play" to/);
 assert.match(back, /widget value "trim1"/);
 assert.equal(new SB3Creator().decompile(parse(back).project), back);
});

test('the organ example programs the shipped named buttons without replacing its analog oscillator', async () => {
 const {readFile}=await import('node:fs/promises');
 const program=await readFile(new URL('../examples/school-miniorgan-107056/program.bw',import.meta.url),'utf8');
 const c=parse(program),blocks=c.project.targets.flatMap(t=>Object.values(t.blocks));
 assert.equal(blocks.filter(b=>b.opcode==='controller_setWidget').length,24);
 assert.equal(blocks.filter(b=>b.opcode==='control_wait').length,8);
 assert.equal(blocks.filter(b=>b.opcode==='event_whenkeypressed').length,1);
 assert.ok(!blocks.some(b=>/^sound_|^music_|circuit_setcontrol/.test(b.opcode)));
 const back=new SB3Creator().decompile(c.project);
 assert.equal(new SB3Creator().decompile(parse(back).project),back);
});
