import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {workflowSources, assertCheckoutPins, assertNoRawClones, assertInvokedScriptsPinned} from '../scripts/ci-workflow-inputs.mjs';

test('every workflow external checkout is immutable and new raw clones fail closed', () => {
    const workflows = workflowSources(new URL('..', import.meta.url).pathname);
    const sites = assertCheckoutPins(workflows);
    assertNoRawClones(workflows);
    console.log(`Audited ${sites.length} external checkout sites in ${workflows.size} workflows`);
});

test('new workflows and adjacent checkout steps cannot bypass the derived gate', () => {
    const base = 'steps:\n  - uses: actions/checkout@full\n    with:\n      repository: Acme/new\n';
    const audit = source => assertCheckoutPins(new Map([['new.yml', source]]));
    assert.throws(() => audit(base), /Acme\/new: expected a full/);
    assert.throws(() => audit(base + '      ref: main\n'), /got main/);
    assert.throws(() => audit(base + '      ref: abc1234\n'), /got abc1234/);
    assert.equal(audit(base + '      ref: ' + 'a'.repeat(40) + '\n').length, 1);
    assert.throws(() => audit(base + '  - uses: actions/checkout@full\n    with:\n      repository: Acme/pinned\n      ref: ' + 'a'.repeat(40) + '\n'), /Acme\/new: expected a full/);
    assert.throws(() => assertNoRawClones(new Map([['new.yml', 'run: git clone https://example.invalid/new.git']])), /new.yml: unreviewed raw clone/);
});

test('workflow-invoked scripts cannot hide an unreviewed clone', () => {
    const root = new URL('..', import.meta.url);
    const workflows = workflowSources(root.pathname);
    assertInvokedScriptsPinned(workflows, file => readFileSync(new URL(file, root), 'utf8'));
    const fixture = new Map([['new.yml', 'run: node scripts/new.mjs']]);
    assert.throws(() => assertInvokedScriptsPinned(fixture,
        () => "run('git', ['clone', 'example.invalid']);"), /scripts\/new.mjs: unreviewed script clone/);
    assert.throws(() => assertInvokedScriptsPinned(fixture, file => file === 'scripts/new.mjs'
        ? "import './nested.mjs';" : "git('clone', 'example.invalid');"), /scripts\/nested.mjs: unreviewed script clone/);
});

test('duplicate-ref fixture: a checkout has exactly one ref field', () => {
    const base = 'steps:\n  - uses: actions/checkout@full\n    with:\n      repository: Acme/duplicate\n      ref: ' + 'a'.repeat(40) + '\n';
    assert.equal(assertCheckoutPins(new Map([['duplicate.yml', base]])).length, 1);
    assert.throws(() => assertCheckoutPins(new Map([['duplicate.yml', base + '      ref: ' + 'b'.repeat(40) + '\n']])), /duplicate checkout ref/);
});
