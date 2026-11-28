// Compile the actual generated target source with Cowgol. The host console
// binding isolates language/arithmetic correctness from individual CPU ports;
// target machine execution is additionally covered by the service integration.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import SB3Creator from '../src/utils/sb3Creator.js';
import {boundaryCase, overflowCases, controlCase} from './fixtures/cowgol/native-cases.mjs';

const fork = process.env.COWGOL_ROOT;
const skip = !fork ? 'Set COWGOL_ROOT for the real pinned Cowgol compiler' : false;

function run(t, pseudocode, {target = 'dos', trace = false} = {}) {
    const creator = new SB3Creator(); creator.parse(pseudocode);
    const generated = creator.generateCowgol(undefined, {target});
    assert.equal(generated.ok, true, generated.reasons.join('; '));
    const work = fs.mkdtempSync(path.join(process.cwd(), '.cowgol-native-profile-'));
    t.after(() => fs.rmSync(work, {recursive: true, force: true}));
    const source = path.join(work, 'main.cow'), binary = path.join(work, 'main');
    fs.writeFileSync(source, generated.cowgol);
    const binding = trace ? ['--with-brickwright', '--host-source', path.join(fork, 'tests/brickwright-host.c')] :
        ['--profile', 'embedded-console'];
    execFileSync('python3', [path.join(fork, 'scripts/compile.py'), source,
        '--build-dir', path.join(fork, '.obj/sb3-creator-tests'), ...binding, '-o', binary],
    {encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024});
    const result = spawnSync(binary, [], {encoding: 'utf8', timeout: 5000});
    assert.ifError(result.error);
    return result;
}

test('native-profile generated arithmetic preserves all int32 boundary signs', {skip}, t => {
    const {source, output} = boundaryCase();
    const result = run(t, source);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout, output);
});

test('native-profile generated arithmetic traps overflowing intermediates before later output', {skip}, t => {
    for (const {name, source, output} of overflowCases) {
        const result = run(t, source);
        assert.notEqual(result.status, 0, name);
        assert.equal(result.stdout, output, name);
    }
});

test('native-profile nested arithmetic calls and short-circuit conditions execute correctly', {skip}, t => {
    const result = run(t, controlCase.source);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout, controlCase.output);
});

test('native Eater and AVR digital profiles emit executable pin modes, polarity and latch toggles', {skip}, t => {
    const eater = run(t, 'DEVICE EATER6502\nPIN led = PB7 OUTPUT ACTIVE LOW\nPIN button = PA0 INPUT\nWHEN flag clicked:\n  turn on led\n  toggle led\n  IF (0 = 1) and (read button = 1) THEN:\n    say "wrong"\n  say read button\n', {target: 'eater6502', trace: true});
    assert.equal(eater.status, 0, eater.stdout + eater.stderr);
    assert.equal(eater.stdout, 'mode 15 1\nmode 0 0\nwrite 15 0\ntoggle 15 1\nread 0\nnumber 1\n');
    for (const [target, device] of [['atmega328p', 'UNO'], ['arduino-nano', 'NANO'], ['atmega168p', 'ATMEGA168P']]) {
        const avr = run(t, `DEVICE ${device}\nPIN led = D13 OUTPUT ACTIVE LOW\nPIN button = A5 INPUT ACTIVE LOW\nWHEN flag clicked:\n  turn on led\n  toggle led\n  say read button\n`, {target, trace: true});
        assert.equal(avr.status, 0, avr.stdout + avr.stderr);
        assert.equal(avr.stdout, 'mode 13 1\nmode 19 2\nwrite 13 0\ntoggle 13 1\nread 19\nnumber 0\n');
    }
});
