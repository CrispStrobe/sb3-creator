// Tests for the sb3c command-line compiler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import examples from '../src/utils/examples.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'bin', 'sb3c.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sb3c-'));

function run(args) {
    return execFileSync('node', [cli, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

test('sb3c compiles a pseudocode file to a valid .sb3', async () => {
    const input = path.join(tmp, 'tetris.txt');
    const output = path.join(tmp, 'tetris.sb3');
    fs.writeFileSync(input, examples.tetris);

    const out = run([input, output]);
    assert.match(out, /wrote .*tetris\.sb3/);
    assert.ok(fs.existsSync(output));

    const zip = await JSZip.loadAsync(fs.readFileSync(output));
    const project = JSON.parse(await zip.file('project.json').async('string'));
    assert.ok(project.targets.some((t) => !t.isStage && t.name === 'Game'));
});

test('sb3c --check validates without writing a file', () => {
    const input = path.join(tmp, 'snake.txt');
    fs.writeFileSync(input, examples.snake);
    const out = run(['--check', input]);
    assert.match(out, /ok/);
    assert.ok(!fs.existsSync(path.join(tmp, 'snake.sb3')));
});

test('sb3c defaults the output name from the input', () => {
    const input = path.join(tmp, 'pong.txt');
    fs.writeFileSync(input, examples.pong_2p);
    run([input]);
    assert.ok(fs.existsSync(path.join(tmp, 'pong.sb3')));
});

test('sb3c exits non-zero on a missing input file', () => {
    assert.throws(() => run([path.join(tmp, 'nope.txt')]));
});
