// A text literal must survive the whole loop: pseudocode -> blocks ->
// pseudocode -> blocks, with the value intact and the block unchanged.
//
// It did not. `display text "..."` matched with `[^"]*`, which stops at the
// first quote, so a line carrying an escaped quote failed its own rule and
// fell through to the GENERIC display handler -- silently emitting a
// micro:bit block for a SPIKE program, with the whole phrase swallowed as its
// value and no warning raised. Separately, and worse because it is quiet, a
// backslash was DOUBLED in the stored value: `C:\path` was saved as
// `C:\\path`, corrupting the project rather than failing it.
import test from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';
import JSZip from 'jszip';
const ops = async p => {
  const out = [];
  for (const t of p.targets) for (const b of Object.values(t.blocks || {})) if (b.opcode) out.push(b.opcode);
  return out.sort();
};
const build = async src => {
  const c = new SB3Creator(); c.parse(src);
  const buf = Buffer.from(await (await c.generateSB3()).arrayBuffer());
  return {warnings: c.warnings || [],
          project: JSON.parse(await (await JSZip.loadAsync(buf)).file('project.json').async('string'))};
};
const esc = v => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const CASES = ['GO', 'say "hi"', 'C:\\path', 'mixed "q" and \\ slash', 'trailing\\', ''];
test('a text literal survives compile, decompile and recompile unchanged', async () => {
for (const v of CASES) {
  const src = `DEVICE SPIKE\n\nWHEN flag clicked:\n  display text "${esc(v)}"\n`;
  const a = await build(src);
  const o1 = await ops(a.project);
  const spike = o1.includes('spikeprime_displayText');
  // the value that survived
  let got = null;
  for (const t of a.project.targets) for (const b of Object.values(t.blocks || {}))
    if (b.opcode === 'spikeprime_displayText') got = b.inputs.TEXT?.[1]?.[1];
  const back = new SB3Creator().decompile(a.project);
  const b2 = await build(back);
  const stable = JSON.stringify(await ops(b2.project)) === JSON.stringify(o1);
  const ok = spike && stable && got === v;
  assert.ok(spike, `${JSON.stringify(v)} did not produce spikeprime_displayText — it fell through to another device's block`);
  assert.equal(got, v, `${JSON.stringify(v)} was altered on the way into the project`);
  assert.ok(stable, `${JSON.stringify(v)} did not survive decompile -> recompile`);
  assert.ok(ok);
}
});
