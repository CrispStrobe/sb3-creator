// STC persistence: declarations must survive scratch-vm's sb3 serializer,
// which keeps only targets/monitors/extensions/meta. The survivor is a Stage
// comment behind a magic marker; readStc prefers the top-level key and falls
// back to the comment. Corruption yields null — absent beats invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import SB3Creator from '../src/utils/sb3Creator.js';

const SRC = 'PIN led1 = P1.0 OUTPUT ACTIVE LOW\nPIN pot = P1.3 ANALOG\n'
  + 'WHEN flag clicked:\n  turn on led1';

// What scratch-vm's serializer does to a project: keep the four keys, drop the rest.
const throughVmSerializer = (project) => JSON.parse(JSON.stringify({
  targets: project.targets, monitors: project.monitors ?? [],
  extensions: project.extensions ?? [], meta: project.meta ?? {},
}));

test('parse writes the persistence comment on the stage', () => {
  const c = new SB3Creator();
  const project = c.parse(SRC);
  const stage = project.targets.find(t => t.isStage);
  const comment = stage.comments[SB3Creator.STC_COMMENT_ID];
  assert.ok(comment, 'stcconfig comment exists');
  assert.ok(comment.text.includes(SB3Creator.STC_MAGIC));
  assert.ok(comment.minimized, 'minimized so it does not clutter the editor');
});

test('declarations survive the vm serializer round-trip', () => {
  const c = new SB3Creator();
  const project = c.parse(SRC);
  const saved = throughVmSerializer(project);
  assert.equal(saved.stc, undefined, 'the serializer really does drop the key');
  const recovered = SB3Creator.readStc(saved);
  assert.deepEqual(recovered, project.stc, 'comment carries the identical block');
  // And decompile on the stripped project regenerates the PIN lines.
  const c2 = new SB3Creator();
  const pseudocode = c2.decompile(saved);
  assert.match(pseudocode, /PIN led1 = P1\.0 OUTPUT ACTIVE LOW/);
  assert.match(pseudocode, /PIN pot = P1\.3 ANALOG/);
});

test('readStc prefers the top-level key and refuses corruption', () => {
  const c = new SB3Creator();
  const project = c.parse(SRC);
  // Key wins over comment.
  assert.equal(SB3Creator.readStc(project), project.stc);
  // Corrupt comment: null, not a guess.
  const saved = throughVmSerializer(project);
  const stage = saved.targets.find(t => t.isStage);
  stage.comments[SB3Creator.STC_COMMENT_ID].text =
    'BrickWright hardware declarations\n' + SB3Creator.STC_MAGIC + '{not json';
  assert.equal(SB3Creator.readStc(saved), null);
  // No comment at all: null.
  delete stage.comments[SB3Creator.STC_COMMENT_ID];
  assert.equal(SB3Creator.readStc(saved), null);
});

test('re-parsing regenerated pseudocode replaces the comment, never accumulates', () => {
  const c = new SB3Creator();
  const p1 = c.parse(SRC);
  const again = new SB3Creator().parse(new SB3Creator().decompile(p1));
  const stage = again.targets.find(t => t.isStage);
  const stcComments = Object.values(stage.comments ?? {})
    .filter(cm => cm.text.includes(SB3Creator.STC_MAGIC));
  assert.equal(stcComments.length, 1);
});
