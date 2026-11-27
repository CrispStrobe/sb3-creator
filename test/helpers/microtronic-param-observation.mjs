// Each invocation gets a fresh engine module graph. The negative control changes
// one instruction-period expression in memory; no sibling file is written.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {injectEngine} from '../../scripts/lib/engine-surface.mjs';
import {declaredParams, makeObserver, perturb, probeKeys} from './param-probe.mjs';

const mode = process.argv[2];
assert.ok(['normal', 'ignored-rate'].includes(mode), 'explicit observation mode');
const device = join(process.env.BW_BOARD, 'src/devices/microtronic.js');
const deviceURL = pathToFileURL(device).href;
const sourceHash = () => createHash('sha256').update(readFileSync(device)).digest('hex');
const beforeHash = sourceHash();
let mutations = 0;
const hooks = mode === 'ignored-rate' ? registerHooks({
    load(url, context, nextLoad) {
        const result = nextLoad(url, context);
        if (url !== deviceURL) return result;
        const source = String(result.source);
        const expression = 'const hz = part.params?.instructionHz ?? 20;';
        assert.equal(source.split(expression).length - 1, 1,
            'the mutant targets exactly the real instruction-period read');
        mutations++;
        return {...result, source: source.replace(expression, 'const hz = 20;')};
    }
}) : null;
const engine = await injectEngine({board: process.env.BW_BOARD, cui: process.env.BW_CIRCUIT_UI});
hooks?.deregister();
const observe = makeObserver({
    Circuit: engine.Circuit,
    getDevice: engine.board.getDevice,
    extractors: {
        extractCp1Machine: engine.board.extractCp1Machine,
        extract6502Machine: engine.surface.extract6502Machine,
        extractZ80Machine: engine.surface.extractZ80Machine,
    },
});
const data = JSON.parse(readFileSync(new URL(
    '../../examples/busch-microtronic-wired-io/circuit.json', import.meta.url), 'utf8'));
const faster = structuredClone(data);
const part = faster.parts.find(p => p.kind === 'busch-microtronic');
assert.equal(part.params.instructionHz, 20, 'the authored lesson rate');
part.params.instructionHz = perturb(part.params.instructionHz);

// Observe the exact state reads made by the real observer. The wrapper calls
// through and returns the original state unchanged; it does not run the device.
const prototype = engine.surface.BoardImpl.prototype;
const getDeviceState = prototype.getDeviceState;
const execution = {normal: [], faster: []};
let phase = 'normal';
prototype.getDeviceState = function (...args) {
    const state = getDeviceState.apply(this, args);
    if (args[0] === part.id && state && execution[phase]) {
        execution[phase].push({running: state.running, executed: state.executed,
            output: state.output, echoedRate: state._paramsInstructionHz});
    }
    return state;
};
let normal, changed, gate;
try {
    normal = observe(data);
    phase = 'faster';
    changed = observe(faster);
    phase = 'gate';
    const {sites} = declaredParams();
    assert.ok(sites.has('busch-microtronic.instructionHz'));
    const result = probeKeys(['busch-microtronic.instructionHz'], sites, observe, new Map());
    gate = {inert: result.inert, unprobeable: result.unprobeable, healed: result.healed};
} finally {
    prototype.getDeviceState = getDeviceState;
}
const differences = changed.flatMap((text, frame) => {
    const before = JSON.parse(normal[frame]), after = JSON.parse(text);
    return Object.keys(after).filter(key => before[key] !== after[key]).map(key => ({frame, key}));
});
assert.equal(sourceHash(), beforeHash, 'the sibling source bytes remain unchanged');
console.log(JSON.stringify({mode, mutations, sourceHash: beforeHash, execution,
    differences, gate}));
