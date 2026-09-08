import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import SB3Creator from '../src/utils/sb3Creator.js';

const SOURCE = `DEVICE STC12C5A60S2
CLOCK 11059200
PIN led1 = P1.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  FOREVER:
    toggle led1
    wait 0.15 seconds
`;

const SCHEDULED_SOURCE = `${SOURCE}
WHEN flag clicked:
  turn off led1
`;

const generate = (debug, source = SOURCE) => {
    const creator = new SB3Creator();
    creator.parse(source);
    assert.deepEqual(creator.warnings, []);
    return creator.generateC(undefined, {debug});
};

const hasSdcc = () => {
    try {
        execFileSync('sdcc', ['--version'], {stdio: 'ignore'});
        return true;
    } catch {
        return false;
    }
};

test('a single 8051 debug task exposes stable scheduler storage', () => {
    const code = generate(true);
    assert.match(code, /static volatile unsigned int bw_task0_state;/);
    assert.match(code, /static volatile unsigned int bw_task0_until;/);
});

test('a non-debug 8051 build retains its compact historical storage policy', () => {
    // A lone release script deliberately lowers straight into main(), so use
    // two scripts to exercise the scheduler whose storage policy is at issue.
    const code = generate(false, SCHEDULED_SOURCE);
    assert.match(code, /static unsigned int bw_task0_state;/);
    assert.match(code, /static unsigned int bw_task0_until;/);
    assert.doesNotMatch(code, /static volatile unsigned int bw_task0_(?:state|until);/);
});

test('linked SDCC debug output locates both single-task scheduler words',
    {skip: !hasSdcc() && 'sdcc is not installed'}, () => {
        const dir = mkdtempSync(join(tmpdir(), 'sb3-debug-symbols-'));
        try {
            const source = join(dir, 'main.c');
            writeFileSync(source, generate(true));
            execFileSync('sdcc', ['--debug', '-mmcs51', '--iram-size', '256',
                '--xram-size', '1024', '--code-size', '61440', '-o', `${dir}/`, source],
            {stdio: 'pipe'});
            const cdb = readFileSync(join(dir, 'main.cdb'), 'utf8');
            for (const field of ['state', 'until']) {
                assert.match(cdb,
                    new RegExp(`^L:(?:F\\w+|G|L\\w+)\\$bw_task0_${field}\\$[^:]*:[0-9A-Fa-f]+$`, 'm'),
                    `linked CDB has no stable address for bw_task0_${field}`);
            }
        } finally {
            rmSync(dir, {recursive: true, force: true});
        }
    });
