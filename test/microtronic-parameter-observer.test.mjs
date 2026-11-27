import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {requireSiblings, siblingGuardTest} from './helpers/siblings.mjs';

const gate = requireSiblings('bw-board', 'bw-circuit-ui');
siblingGuardTest(gate, 'the Microtronic parameter-observer controls');
const helper = fileURLToPath(new URL('./helpers/microtronic-param-observation.mjs', import.meta.url));

function observation(mode) {
    const result = spawnSync(process.execPath, [helper, mode], {
        encoding: 'utf8', timeout: 60_000, maxBuffer: 1 << 20,
        env: {...process.env, BW_BOARD: gate.paths['bw-board'],
            BW_CIRCUIT_UI: gate.paths['bw-circuit-ui']},
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message || result.stdout);
    return JSON.parse(result.stdout);
}

test('Microtronic rate perturbation executes the authored program and moves actual wired lamps',
    {skip: gate.skip}, () => {
        const result = observation('normal');
        assert.equal(result.mutations, 0);
        assert.deepEqual(result.gate, {inert: [], unprobeable: [], healed: []});
        const executed = rows => Math.max(...rows.map(row => row.executed));
        assert.ok(result.execution.normal.some(row => row.running && row.executed > 0),
            'the observer starts the saved halted computer through its public Run control');
        assert.ok(executed(result.execution.faster) > executed(result.execution.normal),
            'the faster rate executes more instructions in the same observation window');
        for (const id of ['lamp1', 'lamp2', 'lamp3']) {
            assert.ok(result.differences.some(row => row.key === `L:${id}`),
                `${id} responds electrically after the input and output instructions`);
        }
        assert.ok(result.differences.some(row => row.key.startsWith('V:')),
            'actual node voltages change, not just machine-state bookkeeping');
    });

test('the parameter gate rejects an engine that echoes instructionHz but ignores its execution rate',
    {skip: gate.skip}, () => {
        const result = observation('ignored-rate');
        assert.equal(result.mutations, 1, 'exactly one engine expression was changed in memory');
        assert.ok(result.execution.normal.every(row => row.echoedRate === 20));
        assert.ok(result.execution.faster.every(row => row.echoedRate === 75),
            'the mutant retains the misleading input cache that made the old gate pass');
        assert.deepEqual(result.gate, {
            inert: ['busch-microtronic.instructionHz — 1 site(s) probed, none moved'],
            unprobeable: [], healed: [],
        }, 'the actual tier-2 verdict must reject the ignored-rate engine');
        assert.ok(result.execution.normal.some(row => row.running && row.executed > 0),
            'the negative control still runs the real program');
        assert.deepEqual(result.differences, [], 'ignoring the rate leaves every observed behavior identical');
    });
