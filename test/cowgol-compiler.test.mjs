// This suite runs the real Cowgol frontend/backend/linker and the resulting
// native executable. CI checks out the explicit fork pin, never a moving head.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import SB3Creator from '../src/utils/sb3Creator.js';

const fork = process.env.COWGOL_ROOT;
function run(t, pseudocode) {
    const c = new SB3Creator(); c.parse(pseudocode); const result = c.generateCowgol();
    assert.equal(result.ok, true, result.reasons.join('; '));
    const work = fs.mkdtempSync(path.join(process.cwd(), '.cowgol-native-'));
    t.after(() => fs.rmSync(work, {recursive: true, force: true}));
    const source = path.join(work, 'program.cow'), binary = path.join(work, 'program');
    fs.writeFileSync(source, result.cowgol);
    execFileSync('python3', [path.join(fork, 'scripts/compile.py'), source,
        '--build-dir', path.join(fork, '.obj/sb3-creator-tests'), '--with-brickwright',
        '--host-source', path.join(fork, 'tests/brickwright-host.c'), '-o', binary], {timeout: 60000});
    return execFileSync(binary, {encoding: 'utf8', timeout: 5000});
}

test('generated loops, electrical writes, toggle, turtle and time execute in real Cowgol', {skip: !fork}, t => {
    assert.equal(run(t, fs.readFileSync(new URL('./fixtures/cowgol/host.bw', import.meta.url), 'utf8')),
        fs.readFileSync(new URL('./fixtures/cowgol/host.good', import.meta.url), 'utf8'));
});

test('generated strings survive the real compiler and host callback byte-for-byte', {skip: !fork}, t => {
    const messages = ['001', '# ; := and then', 'quote " slash \\', 'München 🌱', 'two\nlines', 'x'.repeat(127), '🌱'.repeat(31) + 'abc'];
    const pseudocode = 'WHEN flag clicked:\n' + messages.map(s => `  say ${JSON.stringify(s)}\n`).join('');
    assert.equal(run(t, pseudocode), messages.map(s => `say ${s}\n`).join(''));
});
