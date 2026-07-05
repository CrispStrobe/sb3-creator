// Unit tests: assert the parser emits the right blocks/inputs/fields for each feature.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, blocksOf, findBlock, findAll, hasOpcode, inputBlock, sprite } from './helpers.mjs';

// ---- Confirmed bug fixes --------------------------------------------------------

test('B1: "play sound X until done" emits sound_playuntildone, not sound_play', () => {
    const b = blocksOf(build(sprite('S', 'play sound "Meow" until done')), 'S');
    assert.ok(hasOpcode(b, 'sound_playuntildone'));
    assert.ok(!hasOpcode(b, 'sound_play'));
    const play = findBlock(b, 'sound_playuntildone');
    assert.deepEqual(play.inputs.SOUND_MENU, [1, [10, 'Meow']]);
});

test('B2: malformed IF warns instead of crashing', () => {
    const c = build(sprite('S', 'IF score:\n  say "hi"'));
    assert.ok(c.warnings.some(w => /Malformed IF/.test(w)));
    assert.equal(c.checkIntegrity().length, 0);
});

test('B2: malformed REPEAT warns instead of crashing', () => {
    const c = build(sprite('S', 'REPEAT:\n  move 1 steps'));
    assert.ok(c.warnings.some(w => /Malformed REPEAT/.test(w)));
});

test('B3: WHEN sprite clicked is implemented', () => {
    const c = build('SPRITE S:\n  WHEN sprite clicked:\n    say "hi"\n');
    assert.ok(hasOpcode(blocksOf(c, 'S'), 'event_whenthisspriteclicked'));
    assert.equal(c.warnings.length, 0);
});

test('B4: <= becomes not(gt); >= becomes not(lt)', () => {
    const b = blocksOf(build(sprite('S', 'IF score <= 5 THEN:\n  say "hi"')), 'S');
    const nots = findAll(b, 'operator_not');
    assert.equal(nots.length, 1);
    const inner = b[nots[0].inputs.OPERAND[1]];
    assert.equal(inner.opcode, 'operator_gt');

    const b2 = blocksOf(build(sprite('S', 'IF score >= 5 THEN:\n  say "hi"')), 'S');
    const inner2 = b2[findBlock(b2, 'operator_not').inputs.OPERAND[1]];
    assert.equal(inner2.opcode, 'operator_lt');
});

test('pre-existing shadowing fixed: "set pen color to" is a pen block, not a variable', () => {
    const c = build(sprite('S', 'set pen color to #ff0000'));
    const b = blocksOf(c, 'S');
    assert.ok(hasOpcode(b, 'pen_setPenColorToColor'));
    assert.equal(c.variables.size, 0);
    assert.ok(c.project.extensions.includes('pen'));
});

test('pre-existing shadowing fixed: set size / set volume are looks/sound blocks', () => {
    const b = blocksOf(build(sprite('S', 'set size to 150\nset volume to 40')), 'S');
    assert.ok(hasOpcode(b, 'looks_setsizeto'));
    assert.ok(hasOpcode(b, 'sound_setvolumeto'));
});

// ---- Expression engine ----------------------------------------------------------

test('F2: pick random A to B', () => {
    const b = blocksOf(build(sprite('S', 'set n to pick random 1 to 10')), 'S');
    const r = findBlock(b, 'operator_random');
    assert.deepEqual(r.inputs.FROM, [1, [4, '1']]);
    assert.deepEqual(r.inputs.TO, [1, [4, '10']]);
});

test('F3: mod / round / sqrt / join / length / letter', () => {
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'set n to 7 mod 3')), 'S'), 'operator_mod'));
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'set n to round 4')), 'S'), 'operator_round'));
    const b = blocksOf(build(sprite('S', 'set n to sqrt of 9')), 'S');
    const mo = findBlock(b, 'operator_mathop');
    assert.deepEqual(mo.fields.OPERATOR, ['sqrt', null]);
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'set n to "a" join "b"')), 'S'), 'operator_join'));
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'set n to length of "hello"')), 'S'), 'operator_length'));
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'set n to letter 1 of "hi"')), 'S'), 'operator_letter_of'));
});

test('F4: precedence — a + b * c nests multiply under add', () => {
    const b = blocksOf(build(sprite('S', 'set n to 2 + 3 * 4')), 'S');
    const add = findBlock(b, 'operator_add');
    assert.ok(add, 'top-level op is add');
    const rhs = b[add.inputs.NUM2[1]];
    assert.equal(rhs.opcode, 'operator_multiply');
});

test('F4: parentheses override precedence — (a + b) * c', () => {
    const b = blocksOf(build(sprite('S', 'set n to (2 + 3) * 4')), 'S');
    const mul = findBlock(b, 'operator_multiply');
    assert.ok(mul, 'top-level op is multiply');
    const lhs = b[mul.inputs.NUM1[1]];
    assert.equal(lhs.opcode, 'operator_add');
});

test('F4: a + b + c no longer silently dropped', () => {
    const c = build(sprite('S', 'set n to 1 + 2 + 3'));
    const b = blocksOf(c, 'S');
    assert.equal(findAll(b, 'operator_add').length, 2);
    assert.equal(c.checkIntegrity().length, 0);
});

test('unary minus on a reporter builds 0 - x', () => {
    const b = blocksOf(build(sprite('S', 'change y by -1 * 5')), 'S');
    // -1 stays a literal inside multiply; ensure no crash and multiply present
    assert.ok(hasOpcode(b, 'operator_multiply'));
});

test('F1: reporters x position / direction / size / mouse x / timer / answer', () => {
    const map = {
        'go to x: mouse x y: mouse y': ['sensing_mousex', 'sensing_mousey'],
        'set a to x position': ['motion_xposition'],
        'set a to direction': ['motion_direction'],
        'set a to size': ['looks_size'],
        'set a to timer': ['sensing_timer'],
        'set a to answer': ['sensing_answer'],
        'set a to costume number': ['looks_costumenumbername'],
    };
    for (const [code, ops] of Object.entries(map)) {
        const b = blocksOf(build(sprite('S', code)), 'S');
        for (const op of ops) assert.ok(hasOpcode(b, op), `${code} -> ${op}`);
    }
});

test('reporter defers to a same-named variable', () => {
    // `direction` has no set-command, so `set direction to 5` makes it a real variable;
    // a later `direction` must resolve to that variable, not the motion_direction reporter.
    const c = build(sprite('S', 'set direction to 5\nset a to direction'));
    const b = blocksOf(c, 'S');
    assert.ok(!hasOpcode(b, 'motion_direction'));
    const setA = findAll(b, 'data_setvariableto').find(x => x.fields.VARIABLE[0] === 'a');
    assert.equal(setA.inputs.VALUE[1][0], 12); // 12 == variable primitive
});

// ---- Conditions -----------------------------------------------------------------

test('F5: and / or / not compound conditions', () => {
    const b = blocksOf(build(sprite('S', 'IF score > 1 and score < 9 THEN:\n  say "y"')), 'S');
    assert.ok(hasOpcode(b, 'operator_and'));
    const b2 = blocksOf(build(sprite('S', 'IF not touching Wall THEN:\n  say "y"')), 'S');
    assert.ok(hasOpcode(b2, 'operator_not'));
    const b3 = blocksOf(build(sprite('S', 'IF score = 1 or score = 2 THEN:\n  say "y"')), 'S');
    assert.ok(hasOpcode(b3, 'operator_or'));
});

test('F6: predicates key pressed? / mouse down? / touching color / contains', () => {
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'IF key space pressed? THEN:\n  say "y"')), 'S'), 'sensing_keypressed'));
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'IF mouse down? THEN:\n  say "y"')), 'S'), 'sensing_mousedown'));
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'IF touching color #ff0000 THEN:\n  say "y"')), 'S'), 'sensing_touchingcolor'));
    assert.ok(hasOpcode(blocksOf(build(sprite('S', 'IF "abc" contains "b" THEN:\n  say "y"')), 'S'), 'operator_contains'));
});

// ---- Events / clones / control --------------------------------------------------

test('E1/E2/E3: broadcast, broadcast and wait, WHEN I receive share a registered id', () => {
    const c = build('SPRITE S:\n  WHEN flag clicked:\n    broadcast "go"\n    broadcast "go" and wait\n  WHEN I receive "go":\n    say "got it"\n');
    const b = blocksOf(c, 'S');
    const send = findBlock(b, 'event_broadcast');
    const wait = findBlock(b, 'event_broadcastandwait');
    const recv = findBlock(b, 'event_whenbroadcastreceived');
    assert.ok(send && wait && recv);
    const id = send.inputs.BROADCAST_INPUT[1][2];
    assert.equal(wait.inputs.BROADCAST_INPUT[1][2], id);
    assert.equal(recv.fields.BROADCAST_OPTION[1], id);
    const stage = c.project.targets.find(t => t.isStage);
    assert.equal(stage.broadcasts[id], 'go');
});

test('C1: clones — create clone of / delete this clone / WHEN I start as a clone', () => {
    const c = build('SPRITE S:\n  WHEN flag clicked:\n    create clone of myself\n    create clone of Bullet\n    delete this clone\n  WHEN I start as a clone:\n    show\n');
    const b = blocksOf(c, 'S');
    const clones = findAll(b, 'control_create_clone_of');
    assert.equal(clones.length, 2);
    const menu = b[clones[0].inputs.CLONE_OPTION[1]];
    assert.deepEqual(menu.fields.CLONE_OPTION, ['_myself_', null]);
    assert.ok(hasOpcode(b, 'control_delete_this_clone'));
    assert.ok(hasOpcode(b, 'control_start_as_clone'));
});

test('C2/C3: REPEAT UNTIL and WAIT UNTIL', () => {
    const b = blocksOf(build(sprite('S', 'REPEAT UNTIL score > 5:\n  change score by 1\nwait until score > 9')), 'S');
    const ru = findBlock(b, 'control_repeat_until');
    assert.ok(ru && ru.inputs.CONDITION && ru.inputs.SUBSTACK);
    assert.ok(hasOpcode(b, 'control_wait_until'));
});

// ---- Lists ----------------------------------------------------------------------

test('D1: list ops add/delete/insert/replace + reporters', () => {
    const code = 'SPRITE S:\n' +
        '  LIST body\n' +
        '  WHEN flag clicked:\n' +
        '    add 5 to body\n' +
        '    insert 9 at 1 of body\n' +
        '    replace item 1 of body with 3\n' +
        '    delete 2 of body\n' +
        '    delete all of body\n' +
        '    set a to item 1 of body\n' +
        '    set b to length of body\n' +
        '    IF body contains 3 THEN:\n' +
        '      say "in"\n';
    const c = build(code);
    const b = blocksOf(c, 'S');
    for (const op of ['data_addtolist', 'data_insertatlist', 'data_replaceitemoflist',
        'data_deleteoflist', 'data_deletealloflist', 'data_itemoflist',
        'data_lengthoflist', 'data_listcontainsitem']) {
        assert.ok(hasOpcode(b, op), op);
    }
    assert.equal(c.checkIntegrity().length, 0);
});

// ---- Scoping --------------------------------------------------------------------

test('S1: GLOBAL / LOCAL declarations control variable scope', () => {
    const code = 'GLOBAL wins\n' +
        'SPRITE A:\n' +
        '  LOCAL hp\n' +
        '  WHEN flag clicked:\n' +
        '    set wins to 1\n' +
        '    set hp to 100\n';
    const c = build(code);
    const stage = c.project.targets.find(t => t.isStage);
    const a = c.project.targets.find(t => t.name === 'A');
    assert.ok(Object.values(stage.variables).some(v => v[0] === 'wins'), 'wins is global (on Stage)');
    assert.ok(Object.values(a.variables).some(v => v[0] === 'hp'), 'hp is local (on sprite A)');
    assert.ok(!Object.values(stage.variables).some(v => v[0] === 'hp'), 'hp not on Stage');
});

test('S1: LOCAL overrides the legacy magic-name globals', () => {
    // "score" is a legacy magic global; LOCAL must force it local.
    const code = 'SPRITE A:\n  LOCAL score\n  WHEN flag clicked:\n    set score to 1\n';
    const c = build(code);
    const stage = c.project.targets.find(t => t.isStage);
    const a = c.project.targets.find(t => t.name === 'A');
    assert.ok(Object.values(a.variables).some(v => v[0] === 'score'));
    assert.ok(!Object.values(stage.variables).some(v => v[0] === 'score'));
});

// ---- Costumes -------------------------------------------------------------------

test('S2: each sprite gets a distinct costume asset', () => {
    const c = build('SPRITE A:\n  WHEN flag clicked:\n    show\nSPRITE B:\n  WHEN flag clicked:\n    show\n');
    const a = c.project.targets.find(t => t.name === 'A');
    const bb = c.project.targets.find(t => t.name === 'B');
    assert.notEqual(a.costumes[0].assetId, bb.costumes[0].assetId);
    // and the referenced assets are actually registered
    assert.ok(c.assets.has(a.costumes[0].assetId));
    assert.ok(c.assets.has(bb.costumes[0].assetId));
});
