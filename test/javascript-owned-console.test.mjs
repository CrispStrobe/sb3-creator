import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import SB3Creator from '../src/utils/sb3Creator.js';

const options = {async: true, execution: 'owned-console-v1'};
const creator = source => {
    const c = new SB3Creator();
    c.parse(source);
    return c;
};
const emit = source => {
    const c = creator(source);
    return c.generateJavaScript(c.project, options);
};
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return {promise, resolve, reject};
};

// A deliberately small host contract referee, not the production worker. It
// captures the actual emitted tasks and their returned promises; the host's
// worker/browser suite owns timeout, cancellation and stale-message proof.
const host = () => {
    const tasks = [], questions = [], waits = [], logs = [], scopes = [];
    const active = scope => assert.equal(scope.active, true, 'a completed scope cannot acquire resources');
    const taskApi = scope => Object.freeze({
        version: 1,
        spawn (fn) {
            active(scope);
            assert.equal(typeof fn, 'function', 'the emitter registers a thunk');
            const child = {active: true};
            child.api = taskApi(child);
            scopes.push(child);
            const task = Promise.resolve().then(() => fn(child.api)).then(
                value => { child.active = false; return value; },
                error => { child.active = false; throw error; });
            task.catch(() => {}); // observe rejections even before completion is awaited
            tasks.push(task);
            // Registration only: callers join sequential work with a direct
            // awaited function call, not with the result of spawn().
        },
        input (question) {
            active(scope);
            assert.notEqual(scope, entry, 'generated flags must use their task-scoped input');
            const pending = deferred();
            questions.push({question, scope, ...pending});
            return pending.promise;
        },
        sleep (milliseconds) {
            active(scope);
            assert.notEqual(scope, entry, 'generated flags must use their task-scoped sleep');
            const pending = deferred();
            waits.push({milliseconds, scope, ...pending});
            return pending.promise;
        }
    });
    const entry = {active: true};
    const api = taskApi(entry);
    return {api, tasks, questions, waits, logs, scopes,
        run (source) {
            const console = {log: value => logs.push(value)};
            try {
                new Function('codeRun', 'console', 'prompt', source)(api, console,
                    () => { throw new Error('Owned source must never replay prompt.'); });
            } finally { entry.active = false; }
        },
        completion: () => Promise.all(tasks)};
};

const twoFlags = [
    'SPRITE Console:',
    '  WHEN flag clicked:',
    '    say "first"',
    '    wait 0.02 seconds',
    '    say "later"',
    '  WHEN flag clicked:',
    '    say "sibling"'
].join('\n');

// Scratch permits a hexagonal Boolean reporter in an ordinary value socket.
// Parse its real condition graph, then move that graph into the requested
// socket, retaining the serialized SB3 connections and parent relationships.
const moveConditionToValue = (c, opcode, inputName) => {
    const blocks = c.project.targets[1].blocks;
    const [conditionId, condition] = Object.entries(blocks).find(([, b]) => b.opcode === 'control_if');
    const [receiverId, receiver] = Object.entries(blocks).find(([, b]) => b.opcode === opcode);
    const reporterId = condition.inputs.CONDITION[1];
    const firstId = condition.inputs.SUBSTACK[1];
    blocks[condition.parent].next = firstId;
    blocks[firstId].parent = condition.parent;
    receiver.inputs[inputName] = [3, reporterId, [10, '']];
    blocks[reporterId].parent = receiverId;
    delete blocks[conditionId];
    return c;
};

for (const [opcode, predicates] of [
    ['operator_gt', ['2 > 1', '1 > 2']],
    ['operator_lt', ['1 < 2', '2 < 1']],
    ['operator_equals', ['7 = "7"', '7 = 8']],
    ['operator_and', ['(2 > 1) and (3 > 1)', '(2 > 1) and (3 < 1)']],
    ['operator_or', ['(2 < 1) or (3 > 1)', '(2 < 1) or (3 < 1)']],
    ['operator_not', ['not (2 < 1)', 'not (2 > 1)']]
]) {
    test(`admitted ${opcode} reporters retain true and false in value sockets`, async () => {
        for (const [index, predicate] of predicates.entries()) {
            const c = moveConditionToValue(creator([
                'SPRITE Console:',
                '  WHEN flag clicked:',
                `    IF ${predicate} THEN:`,
                '      say "placeholder"'
            ].join('\n')), 'looks_say', 'MESSAGE');
            const f = host();
            f.run(c.generateJavaScript(c.project, options));
            await f.completion();
            assert.deepEqual(f.logs, [index === 0], predicate);
        }
    });
}

test('an admitted Boolean value survives assignment and an awaited procedure', async () => {
    const c = moveConditionToValue(creator([
        'GLOBAL choice',
        'SPRITE Console:',
        '  DEFINE report (value):',
        '    wait 0.001 seconds',
        '    say value',
        '  WHEN flag clicked:',
        '    IF (2 > 1) and not (3 < 1) THEN:',
        '      set choice to "placeholder"',
        '      report (choice)'
    ].join('\n')), 'data_setvariableto', 'VALUE');
    const f = host();
    f.run(c.generateJavaScript(c.project, options));
    await flush();
    assert.equal(f.waits[0].scope, f.scopes[0]);
    assert.deepEqual(f.logs, []);
    f.waits[0].resolve();
    await f.completion();
    assert.deepEqual(f.logs, [true]);
});

test('an admitted Boolean input question uses its value before awaiting the reply', async () => {
    const c = moveConditionToValue(creator([
        'SPRITE Console:',
        '  WHEN flag clicked:',
        '    IF 2 < 1 THEN:',
        '      ask "placeholder" and wait',
        '      say answer'
    ].join('\n')), 'sensing_askandwait', 'QUESTION');
    const f = host();
    f.run(c.generateJavaScript(c.project, options));
    await flush();
    assert.equal(f.questions[0].question, 'false');
    assert.equal(f.questions[0].scope, f.scopes[0]);
    f.questions[0].resolve('received');
    await f.completion();
    assert.deepEqual(f.logs, ['received']);
});

test('owned flags register synchronously and keep their delayed completion handles', async () => {
    const source = emit(twoFlags);
    assert.doesNotThrow(() => new Function(source), 'the result is classic-script syntax');
    const f = host();
    f.run(source);
    assert.equal(f.tasks.length, 2, 'both flags have owners before entry returns');
    let completed = false;
    const done = f.completion().then(() => { completed = true; });
    await flush();
    assert.deepEqual(f.logs, ['first', 'sibling'], 'a waiting flag does not serialize its sibling');
    assert.equal(completed, false);
    assert.equal(f.waits[0].milliseconds, 20, 'Scratch seconds become host milliseconds');
    f.waits[0].resolve();
    await done;
    assert.deepEqual(f.logs, ['first', 'sibling', 'later']);
});

test('nested procedure waits and a codeRun argument remain in their flag lifetime', async () => {
    const source = emit([
        'SPRITE Console:',
        '  DEFINE delayed (codeRun):',
        '    say codeRun',
        '    wait 0.003 seconds',
        '    say "procedure-after"',
        '  WHEN flag clicked:',
        '    delayed (7)',
        '    say "caller-after"'
    ].join('\n'));
    assert.match(source, /function s0_do_delayed\(codeRun, codeRun_2\)/);
    assert.match(source, /await s0_do_delayed\(codeRun, 7\)/);
    const f = host();
    f.run(source);
    assert.equal(f.tasks.length, 1);
    await flush();
    assert.deepEqual(f.logs, [7]);
    assert.equal(f.waits[0].milliseconds, 3);
    assert.equal(f.waits[0].scope, f.scopes[0]);
    f.waits[0].resolve();
    await f.completion();
    assert.deepEqual(f.logs, [7, 'procedure-after', 'caller-after']);
});

test('the same task scope reaches nested procedure input after asynchronous suspension', async () => {
    const source = emit([
        'SPRITE Console:',
        '  DEFINE question (value):',
        '    ask value and wait',
        '    say answer',
        '  DEFINE delayed (value):',
        '    wait 0.003 seconds',
        '    question (value)',
        '  WHEN flag clicked:',
        '    delayed ("name?")',
        '    say "first-after"',
        '  WHEN flag clicked:',
        '    wait 0.005 seconds',
        '    say "second-after"'
    ].join('\n'));
    const f = host();
    f.run(source);
    await flush();
    assert.equal(f.scopes.length, 2);
    assert.notEqual(f.scopes[0].api, f.scopes[1].api);
    assert.equal(f.waits[0].scope, f.scopes[0]);
    assert.equal(f.waits[1].scope, f.scopes[1]);
    f.waits[0].resolve();
    await flush();
    assert.equal(f.questions[0].question, 'name?');
    assert.equal(f.questions[0].scope, f.scopes[0], 'the nested procedure receives its original task owner');
    f.questions[0].resolve('Ada');
    await flush();
    assert.deepEqual(f.logs, ['Ada', 'first-after']);
    assert.equal(f.scopes[0].active, false);
    assert.equal(f.scopes[1].active, true);
    f.waits[1].resolve();
    await f.completion();
    assert.deepEqual(f.logs, ['Ada', 'first-after', 'second-after']);
});

test('omitting the scoped procedure argument fails before a later effect', async () => {
    const source = emit([
        'SPRITE Console:',
        '  DEFINE delayed (value):',
        '    wait 0.001 seconds',
        '    say value',
        '  WHEN flag clicked:',
        '    delayed ("after")'
    ].join('\n'));
    const control = host();
    control.run(source);
    await flush();
    control.waits[0].resolve();
    await control.completion();
    assert.deepEqual(control.logs, ['after']);

    const call = 'await s0_do_delayed(codeRun, "after");';
    assert.equal(source.split(call).length, 2, 'mutate exactly the real procedure call');
    const missingScope = source.replace(call, 'await s0_do_delayed("after");');
    const mutant = host();
    mutant.run(missingScope);
    await assert.rejects(mutant.completion(), /codeRun\.sleep is not a function/);
    assert.deepEqual(mutant.logs, []);
    assert.deepEqual(mutant.waits, []);
});

test('awaited repeated input resumes once without replaying earlier effects', async () => {
    const source = emit([
        'SPRITE Console:',
        '  WHEN flag clicked:',
        '    say "once"',
        '    ask "first?" and wait',
        '    say answer',
        '    ask "second?" and wait',
        '    say answer'
    ].join('\n'));
    const f = host();
    f.run(source);
    await flush();
    assert.deepEqual(f.logs, ['once']);
    assert.deepEqual(f.questions.map(q => q.question), ['first?']);
    f.questions[0].resolve('Ada');
    await flush();
    assert.deepEqual(f.logs, ['once', 'Ada']);
    assert.deepEqual(f.questions.map(q => q.question), ['first?', 'second?']);
    f.questions[1].resolve('42');
    await f.completion();
    assert.deepEqual(f.logs, ['once', 'Ada', '42']);
});

for (const operation of ['input', 'sleep']) {
    test(`a rejected ${operation} rejects the registered flag before its later effect`, async () => {
        const command = operation === 'input' ? 'ask "question" and wait' : 'wait 0.1 seconds';
        const f = host();
        f.run(emit(`SPRITE Console:\n  WHEN flag clicked:\n    ${command}\n    say "must not run"`));
        await flush();
        const pending = operation === 'input' ? f.questions[0] : f.waits[0];
        const failure = new Error(`rejected ${operation}`);
        pending.reject(failure);
        await assert.rejects(f.completion(), error => error === failure);
        assert.deepEqual(f.logs, []);
    });
}

test('learner globals cannot overwrite the owner or its console bindings', async () => {
    const f = host();
    f.run(emit([
        'GLOBAL codeRun', 'GLOBAL console', 'GLOBAL Number', 'GLOBAL answer',
        'SPRITE Console:',
        '  WHEN flag clicked:',
        '    set codeRun to 5',
        '    set console to 6',
        '    set Number to 7',
        '    say codeRun',
        '    say console',
        '    say Number',
        '    wait 0 seconds',
        '    ask "answer?" and wait',
        '    say answer'
    ].join('\n')));
    await flush();
    assert.deepEqual(f.logs, [5, 6, 7]);
    f.waits[0].resolve();
    await flush();
    f.questions[0].resolve('owned');
    await f.completion();
    assert.deepEqual(f.logs, [5, 6, 7, 'owned']);
});

test('actual SB3 archive data emits and runs the admitted counted-loop console program', async () => {
    const c = creator([
        'SPRITE Console:',
        '  WHEN flag clicked:',
        '    set total to 0',
        '    REPEAT 3:',
        '      change total by 2',
        '    IF total = 6 THEN:',
        '      say total',
        '    ELSE:',
        '      say "wrong"'
    ].join('\n'));
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(c.project));
    const bytes = await zip.generateAsync({type: 'uint8array'});
    const restored = JSON.parse(await (await JSZip.loadAsync(bytes)).file('project.json').async('string'));
    const f = host();
    f.run(c.generateJavaScript(restored, options));
    await f.completion();
    assert.deepEqual(f.logs, [6]);
});

for (const api of [undefined, null, {}, {version: 2},
    {version: 1, spawn () {}, input () {}}, {version: 1, spawn () {}, sleep () {}},
    {version: 1, input () {}, sleep () {}}]) {
    test(`an absent or incompatible host fails before console effects: ${JSON.stringify(api)}`, () => {
        const logs = [];
        const source = emit(twoFlags);
        assert.throws(() => new Function('codeRun', 'console', source)(api, {log: value => logs.push(value)}),
            /requires the owned-console-v1 codeRun API/);
        assert.deepEqual(logs, []);
    });
}

test('execution contract options fail closed', () => {
    const c = creator(twoFlags);
    for (const opts of [
        {execution: 'owned-console-v1'},
        {execution: 'owned-console-v1', async: false},
        {...options, events: true},
        {...options, driver: 'remote'},
        {...options, driver: 'simulator'},
        {...options, driver: 'ondevice'},
        {...options, execution: 'owned-console-v2'}
    ]) assert.throws(() => c.generateJavaScript(c.project, opts), /owned-console-v1:/);
});

for (const opcode of [
    'event_whenkeypressed', 'event_whenbroadcastreceived', 'event_broadcastandwait',
    'control_forever', 'control_repeat_until', 'control_wait_until', 'control_stop',
    'control_start_as_clone', 'control_create_clone_of',
    'looks_sayforsecs', 'motion_movesteps', 'sensing_keypressed', 'sound_playuntildone',
    'arcade_createSprite', 'stc12_setPin', 'unknown_future_opcode'
]) {
    test(`owned console refuses unsupported graph content: ${opcode}`, () => {
        const c = creator(twoFlags);
        // Include a disconnected block to prove validation covers more than
        // the flag's immediate chain, including inactive event/game content.
        c.project.targets[1].blocks.unsupported = {opcode, topLevel: true, inputs: {}, fields: {}};
        assert.throws(() => c.generateJavaScript(c.project, options), error =>
            error.message.includes(`unsupported block ${opcode}`) && error.message.includes('Console / unsupported'));
    });
}

test('run-without-screen-refresh procedures require a separate scheduler contract', () => {
    const c = creator('SPRITE Console:\n  DEFINE task (value):\n    say value\n  WHEN flag clicked:\n    task (1)');
    const prototype = Object.values(c.project.targets[1].blocks).find(block => block.opcode === 'procedures_prototype');
    prototype.mutation.warp = 'true';
    assert.throws(() => c.generateJavaScript(c.project, options), /requires a scheduler contract/);
});

test('unsupported math variants and separate literal shadow nodes are refused rather than neutralized', () => {
    const c = creator(twoFlags);
    const blocks = c.project.targets[1].blocks;
    blocks.unsupported = {opcode: 'operator_mathop', fields: {OPERATOR: ['asin']}, inputs: {}};
    assert.throws(() => c.generateJavaScript(c.project, options), /unsupported math function/);
    blocks.unsupported = {opcode: 'math_number', shadow: true, fields: {NUM: ['5']}, inputs: {}};
    assert.throws(() => c.generateJavaScript(c.project, options), /unsupported block math_number/);
});

test('owned and refused requests do not alter default source on a reused generator', () => {
    const c = moveConditionToValue(creator([
        'SPRITE Console:',
        '  WHEN flag clicked:',
        '    IF (2 > 1) and not (3 < 1) THEN:',
        '      say "placeholder"'
    ].join('\n')), 'looks_say', 'MESSAGE');
    const ordinary = c.generateJavaScript();
    const legacyAsync = c.generateJavaScript(c.project, {async: true});
    assert.doesNotMatch(ordinary, /codeRun/);
    assert.match(legacyAsync, /\(async \(\) => \{ await s0_when_flag_clicked\(\); \}\)\(\);/);
    c.generateJavaScript(c.project, options);
    assert.equal(c.generateJavaScript(), ordinary);
    assert.equal(c.generateJavaScript(c.project, {async: true}), legacyAsync);
    assert.throws(() => c.generateJavaScript(c.project, {...options, events: true}));
    assert.equal(c.generateJavaScript(), ordinary);
});
