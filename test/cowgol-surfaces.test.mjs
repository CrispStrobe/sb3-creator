// Qualify the CLI and bare-JavaScript host boundaries against the shared
// producer. Neither path may silently select host semantics for a native target.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import SB3Creator from '../src/utils/sb3Creator.js';
import {cowgolTargets} from '../src/utils/cowgol.js';
import JSZip from 'jszip';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = 'GLOBAL n = 7\nWHEN flag clicked:\n  say ((n + 2) * (n - 3))\n';
const creator = text => { const result = new SB3Creator(); result.parse(text); return result; };
let engine;
function bareEngine() {
    if (engine) return engine;
    // The full test suite also builds the default embed output. A private
    // destination prevents those independent workers racing on one file.
    const work = fs.mkdtempSync(path.join(root, '.cowgol-embed-'));
    try {
        const bundle = path.join(work, 'transpiler.js');
        execFileSync(process.execPath, ['scripts/bundle-embed.mjs', '--output', bundle], {cwd: root, stdio: 'pipe'});
        engine = vm.createContext({});
        vm.runInContext(fs.readFileSync(bundle, 'utf8'), engine, {timeout: 20000});
    } finally { fs.rmSync(work, {recursive: true, force: true}); }
    assert.equal(engine.bwEmbedReady, true);
    return engine;
}

test('bare embedded native exports match the producer for every qualified target', () => {
    const host = bareEngine();
    assert.equal(vm.runInContext('typeof process + ":" + typeof Buffer + ":" + typeof TextEncoder', host),
        'undefined:undefined:undefined');
    assert.deepEqual(JSON.parse(JSON.stringify(host.bwCowgolTargets())), cowgolTargets());
    for (const {target} of cowgolTargets()) {
        const actual = host.bwTranspileCowgol(source, undefined, {target});
        const expected = creator(source).generateCowgol(undefined, {target});
        assert.equal(actual.ok, true);
        assert.equal(actual.target, target);
        assert.equal(actual.profile, 'native-int32');
        assert.equal(actual.cowgol, expected.cowgol);
        assert.match(actual.cowgol, /bw_checked_mul\(bw_checked_add/);
    }
    const ordinary = host.bwTranspileCowgol(source);
    assert.equal(ordinary.profile, 'host-int32');
    assert.equal(ordinary.cowgol, creator(source).generateCowgol().cowgol);
    assert.equal(host.bwReadCowgol(ordinary.cowgol).ok, true);
});

test('embedded target selection refuses unsupported semantics without changing its inputs', () => {
    const host = bareEngine(), options = {target: 'atmega328p'};
    const pico = 'DEVICE PICO\nPIN led = GP25 OUTPUT\nWHEN flag clicked:\n  turn on led\n';
    assert.throws(() => host.bwTranspileCowgol(pico, undefined, options), /cannot run DEVICE/);
    assert.deepEqual(options, {target: 'atmega328p'});
    const retargeted = host.bwTranspileCowgol(pico, 'arduino-uno', options);
    assert.equal(retargeted.ok, true);
    assert.equal(retargeted.target, 'atmega328p');
    assert.match(retargeted.cowgol, /DEVICE ARDUINO-UNO/);
    for (const bad of [{target: 'arm'}, {target: '__proto__'}, {target: 'dos', profile: 'host-int32'},
        {target: null}, {target: undefined}, {target: ''}, {other: true}, null, []]) {
        assert.throws(() => host.bwTranspileCowgol(source, undefined, bad), /Cowgol|profile/);
    }
    assert.throws(() => host.bwTranspileCowgol('WHEN flag clicked:\n  move 10 steps\n', undefined,
        {target: 'dos'}), /canvas binding/);
    const snapshot = host.bwCowgolTargets();
    snapshot.find(item => item.target === 'atmega328p').devices.push('pico');
    assert.throws(() => host.bwTranspileCowgol(pico, undefined, options), /cannot run DEVICE/);
    const warned = 'WHEN flag clicked:\n  say (1 > 0)\n';
    assert.throws(() => host.bwTranspileCowgol(warned, undefined, {target: 'dos'}), /parser warnings/);
    assert.throws(() => host.bwTranspileCowgol(warned, 'i8086', {target: 'dos'}), /parser warnings/);
    assert.ok(host.bwTranspileCowgol(warned).warnings.some(warning => warning.includes('COMPARISON')));
});

test('producer CLI exports checked native Cowgol and preserves files on every refusal', t => {
    const work = fs.mkdtempSync(path.join(root, '.cowgol-surfaces-'));
    t.after(() => fs.rmSync(work, {recursive: true, force: true}));
    const input = path.join(work, 'input.bw'), output = path.join(work, 'output.cow');
    const cli = (...args) => spawnSync(process.execPath, [path.join(root, 'bin/bw.mjs'), ...args],
        {cwd: root, encoding: 'utf8'});
    fs.writeFileSync(input, source);
    for (const {target} of cowgolTargets()) {
        const result = cli('transpile', input, '--to', 'cowgol', '--target', target, '-o', output);
        assert.equal(result.status, 0, result.stderr);
        assert.equal(fs.readFileSync(output, 'utf8'), creator(source).generateCowgol(undefined, {target}).cowgol);
    }
    const equals = cli('transpile', input, '--to', 'cowgol', '--target=dos', '-o', output);
    assert.equal(equals.status, 0, equals.stderr);
    assert.equal(fs.readFileSync(output, 'utf8'), creator(source).generateCowgol(undefined, {target: 'dos'}).cowgol);
    const keep = 'keep this existing artifact';
    for (const args of [
        ['transpile', input, '--to', 'cowgol', '--target', 'arm'],
        ['transpile', input, '--to', 'cowgol', '--target'],
        ['transpile', input, '--to', 'cowgol', '--target='],
        ['transpile', input, '--to', 'c', '--target', 'dos'],
        ['compile', input, '--target', 'atmega328p']
    ]) {
        fs.writeFileSync(output, keep);
        const result = cli(...args, '-o', output);
        assert.notEqual(result.status, 0, args.join(' '));
        assert.equal(fs.readFileSync(output, 'utf8'), keep);
    }
    fs.writeFileSync(input, 'DEVICE PICO\nPIN led = GP25 OUTPUT\nWHEN flag clicked:\n  turn on led\n');
    let result = cli('transpile', input, '--to', 'cowgol', '--target', 'atmega328p', '-o', output);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /cannot run DEVICE/);
    assert.equal(fs.readFileSync(output, 'utf8'), keep);
    result = cli('transpile', input, '--to', 'cowgol', '--target', 'atmega328p', '--device', 'arduino-uno', '-o', output);
    assert.equal(result.status, 0, result.stderr);
    assert.match(fs.readFileSync(output, 'utf8'), /DEVICE ARDUINO-UNO/);
    fs.writeFileSync(input, 'WHEN flag clicked:\n  say (1 > 0)\n');
    fs.writeFileSync(output, keep);
    for (const extra of [[], ['--device', 'i8086']]) {
        result = cli('transpile', input, '--to', 'cowgol', '--target', 'dos', '-o', output, ...extra);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /parser warnings/);
        assert.equal(fs.readFileSync(output, 'utf8'), keep);
    }
});

test('CLI Cowgol .sb3 export validates the authored graph before any lossy conversion', async t => {
    const work = fs.mkdtempSync(path.join(root, '.cowgol-project-'));
    t.after(() => fs.rmSync(work, {recursive: true, force: true}));
    const input = path.join(work, 'project.sb3'), output = path.join(work, 'output.cow');
    const original = creator(source).project;
    const writeProject = async project => {
        const zip = new JSZip(); zip.file('project.json', JSON.stringify(project));
        fs.writeFileSync(input, await zip.generateAsync({type: 'nodebuffer'}));
    };
    const cli = (...extra) => spawnSync(process.execPath,
        [path.join(root, 'bin/bw.mjs'), 'transpile', input, '--to', 'cowgol', '--target', 'dos', '-o', output, ...extra],
        {cwd: root, encoding: 'utf8'});
    await writeProject(original);
    let result = cli();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(output, 'utf8'), creator(source).generateCowgol(undefined, {target: 'dos'}).cowgol);
    const keep = 'keep authored program';
    fs.writeFileSync(output, keep);
    result = cli('--device', 'i8086');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not accept --device/);
    assert.equal(fs.readFileSync(output, 'utf8'), keep);

    const unsupported = creator('WHEN flag clicked:\n  say 42\n').project;
    const blocks = unsupported.targets.find(target => Object.values(target.blocks).some(block => block.opcode === 'looks_say')).blocks;
    Object.values(blocks).find(block => block.opcode === 'looks_say').opcode = 'unknown_extension_command';
    await writeProject(unsupported);
    result = cli();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unknown_extension_command/);
    assert.equal(fs.readFileSync(output, 'utf8'), keep);

    await writeProject({metadata: {}});
    result = cli();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no targets/);
    assert.equal(fs.readFileSync(output, 'utf8'), keep);
});
