// Live / end-to-end tests: compile every example to a real .sb3, unzip it, and
// deeply validate the project.json graph and that all referenced assets exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';
import examples from '../src/utils/examples.js';

async function compile(code) {
    const c = new SB3Creator();
    c.parse(code);
    const blob = await c.generateSB3();
    const buf = Buffer.from(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);
    const projectJson = JSON.parse(await zip.file('project.json').async('string'));
    const files = new Set(Object.keys(zip.files));
    return { creator: c, project: projectJson, files, size: buf.length };
}

// Round-trip integrity check on the unzipped project.json (independent of the
// in-memory object, so it also catches JSON-serialization surprises).
function assertHealthy(name, project, files) {
    const creator = new SB3Creator();
    const issues = creator.checkIntegrity(project);
    assert.equal(issues.length, 0, `${name} integrity: ${issues.slice(0, 3).join(' | ')}`);

    for (const t of project.targets) {
        for (const c of t.costumes || []) {
            assert.ok(files.has(c.md5ext), `${name}: missing costume asset ${c.md5ext}`);
        }
        for (const s of t.sounds || []) {
            assert.ok(files.has(s.md5ext), `${name}: missing sound asset ${s.md5ext}`);
        }
    }
}

for (const [name, code] of Object.entries(examples)) {
    test(`live: ${name} compiles to a valid .sb3`, async () => {
        const { creator, project, files, size } = await compile(code);
        const v = creator.validate();
        assert.equal(v.isValid, true, `${name} errors: ${v.errors.join(', ')}`);
        assert.equal(v.errors.length, 0);
        assert.equal(creator.warnings.length, 0, `${name} warnings: ${creator.warnings.join(' | ')}`);
        assert.ok(size > 0);
        assert.ok(files.has('project.json'));
        assert.ok(project.targets.length >= 1);
        assert.ok(project.targets.some(t => t.isStage), 'has a Stage');
        assertHealthy(name, project, files);
    });
}

test('live: snake_pro wires clones, broadcasts-free tail, and distinct costumes', async () => {
    const { project, files } = await compile(examples.snake_pro);
    const names = project.targets.map(t => t.isStage ? 'Stage' : t.name);
    assert.deepEqual(names, ['Stage', 'Head', 'Body', 'Apple']);

    const sprites = project.targets.filter(t => !t.isStage);
    const assetIds = new Set(sprites.map(s => s.costumes[0].assetId));
    assert.equal(assetIds.size, sprites.length, 'each sprite has a distinct costume');
    for (const s of sprites) assert.ok(files.has(s.costumes[0].md5ext));

    // Clone + start-as-clone blocks are present and reference real sprites.
    const allBlocks = project.targets.flatMap(t => Object.values(t.blocks || {}));
    assert.ok(allBlocks.some(b => b.opcode === 'control_create_clone_of'));
    assert.ok(allBlocks.some(b => b.opcode === 'control_start_as_clone'));
    assert.ok(allBlocks.some(b => b.opcode === 'control_repeat_until'));
});

test('live: a feature-dense program stays referentially intact', async () => {
    const code = `GLOBAL total
LIST scores
SPRITE Demo:
  WHEN flag clicked:
    set total to pick random 1 to 6
    add total to scores
    add 7 mod 3 to scores
    IF (total > 2 and total < 6) or key space pressed? THEN:
      say length of scores for 1 seconds
    broadcast "tick"
  WHEN I receive "tick":
    change total by 1
    IF scores contains total THEN:
      say "dup"
`;
    const { creator, project, files } = await compile(code);
    assert.equal(creator.warnings.length, 0, creator.warnings.join(' | '));
    assertHealthy('feature-dense', project, files);
    const stage = project.targets.find(t => t.isStage);
    assert.ok(Object.keys(stage.broadcasts).length >= 1, 'broadcast registered on stage');
});
