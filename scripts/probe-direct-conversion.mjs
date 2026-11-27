#!/usr/bin/env node
/**
 * Reproduce the direct-conversion qualification measurements with the app's
 * actual engine injection and authored circuit. Default: production engine.
 * --explicit-only --max-rf-k 7 (128 ns) or 6 (64 ns) selects the independent
 * fine-step reference; those controls are diagnostic and never alter files.
 *
 * node scripts/probe-direct-conversion.mjs --case base --out /path/base.json
 * node scripts/probe-direct-conversion.mjs --case base --explicit-only --max-rf-k 6 --out /path/reference.json
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { injectEngine, locateSibling, REPO_ROOT } from './lib/engine-surface.mjs';
import { BENCHES, benchIds } from './lib/lab-benches-r7mix.mjs';
import { phaseBeat, periodicTone } from '../test/helpers/mixer-beat.mjs';

const options = new Map();
for (let i = 2; i < process.argv.length; i++) {
    const key = process.argv[i];
    assert(['--board', '--cui', '--case', '--warmup-ms', '--end-ms', '--max-rf-k', '--explicit-only', '--out'].includes(key), `unknown option: ${key}`);
    if (key === '--explicit-only') options.set(key, true);
    else {
        assert(process.argv[i + 1] && !process.argv[i + 1].startsWith('--'), `${key} requires a value`);
        options.set(key, process.argv[++i]);
    }
}
const boardInput = options.get('--board') ?? locateSibling('bw-board');
const cuiInput = options.get('--cui') ?? locateSibling('bw-circuit-ui');
assert(boardInput && cuiInput, 'provide --board and --cui or locate both official sibling checkouts');
const boardPath = resolve(boardInput), cuiPath = resolve(cuiInput);
const scenario = options.get('--case') ?? 'base';
const warmupMs = Number(options.get('--warmup-ms') ?? 8);
const endMs = Number(options.get('--end-ms') ?? 11);
const maxK = options.has('--max-rf-k') ? Number(options.get('--max-rf-k')) : null;
const explicitOnly = options.has('--explicit-only');
assert(Number.isFinite(warmupMs) && Number.isFinite(endMs) && warmupMs >= 0 && endMs > warmupMs, 'finite positive observation interval');
// Architectural bound verified 2026-11-27 in the pinned Board's
// src/rf-bands.js: H_UNIT = 1 ns and K_MAX = 15, so k = 0..15 selects
// the engine's supported power-of-two step range, 1 ns through 32.768 us.
assert(maxK === null || (Number.isInteger(maxK) && maxK >= 0 && maxK <= 15), '--max-rf-k must be 0..15');
assert(options.has('--out'), '--out explicitly names the measurement artifact');
const outputPath = resolve(options.get('--out'));
const controls = {
    base: {}, tuned: { tct: 0.302 }, sagged: { vsel: 1 }, opposite: { tct: 0.298 },
    disconnected: {}, 'far-detuned': { tct: 0.6 },
}[scenario];
assert(controls, `unknown scenario: ${scenario}`);

const { RadioFrontEnd, mixerRfGain, mixerLoGain } = await import(pathToFileURL(join(boardPath, 'src/radio.js')));
const { BandIntegrator } = await import(pathToFileURL(join(boardPath, 'src/rf-bands.js')));
if (explicitOnly) BandIntegrator.prototype.implicit = false;
if (maxK !== null) {
    const refresh = RadioFrontEnd.prototype.refresh;
    const bounded = new WeakSet();
    RadioFrontEnd.prototype.refresh = function (...args) {
        const result = refresh.apply(this, args);
        for (const band of this._bands) if (!bounded.has(band)) {
            const previous = band._kForRotation;
            band._kForRotation = function () { return Math.min(maxK, previous ? previous.call(this) : maxK); };
            bounded.add(band);
        }
        return result;
    };
}

const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const circuitPath = join(REPO_ROOT, 'examples/lab-mixer-direct-conversion/circuit.json');
const metadata = {
    board: git(boardPath, 'rev-parse', 'HEAD'), cui: git(cuiPath, 'rev-parse', 'HEAD'), supplier: git(REPO_ROOT, 'rev-parse', 'HEAD'),
    scenario, controls, warmupMs, endMs, dtMs: 0.01,
    runtimeDiagnostic: { explicitOnly, maxK, maximumRfStepSeconds: maxK === null ? null : 1e-9 * 2 ** maxK },
    sourceSha256: Object.fromEntries(['src/radio.js', 'src/rf-bands.js'].map(file => [file, sha256(join(boardPath, file))])),
    circuitSha256: sha256(circuitPath),
    observation: 'Existing complex port history only; sampling never advances the RF integrator.',
};
console.log(JSON.stringify({ started: metadata }));

const { Circuit } = await injectEngine({ board: boardPath, cui: cuiPath });
const ids = benchIds(BENCHES['lab-mixer-direct-conversion']);
const json = JSON.parse(readFileSync(circuitPath, 'utf8'));
if (scenario === 'disconnected') json.parts = json.parts.filter(p => p.id !== ids.cx);
const circuit = Circuit.fromJSON(json), board = circuit.board;
for (const [key, value] of Object.entries(controls)) board.setControl(ids[key], value);
const net = (name, terminal) => {
    const item = board.getNets().find(n => n.terminals.some(t => t.part === ids[name] && t.terminal === terminal));
    assert(item, `${name}.${terminal} has a net`);
    return item.id;
};
const observed = Object.fromEntries(Object.entries({
    speaker: ['spk', 'a'], amplifier: ['u', 'vout'], amplifierInput: ['u', 'inp'], mixerOutput: ['m', 'out_a'],
    transmitterSupply: ['lt', 'a'], receiverSupply: ['m', 'vcc'], txBase: ['q', 'base'], txEmitter: ['q', 'emitter'],
}).map(([key, [name, terminal]]) => [key, net(name, terminal)]));
let tMs = 0;
const run = duration => {
    tMs += duration;
    board.advanceTo(BigInt(Math.round(tMs * 1e6)));
    assert.equal(board.transientAnalysisStatus().failure, null, `transient failure by ${tMs} ms`);
    assert.equal(board._radio?.error ?? null, null, `RF failure by ${tMs} ms`);
};
const rows = [];
let failure = null;
try {
    run(warmupMs);
    for (let i = 0; i < Math.round((endMs - warmupMs) / 0.01); i++) {
        run(0.01);
        const radio = board._radio;
        const detector = radio.detectors.find(d => d.kind === 'mixer' && d.partId === ids.m);
        const junction = radio._mixerJ.get(detector.index), bias = radio._bias[detector.index];
        const transmitter = radio._sys.junctions.find(j => j.kind === 'bjt' && j.d.partId === ids.q);
        const bands = radio._bands.map(band => {
            const rf = band.phasorAt(junction.p[0], tMs / 1000), lo = band.phasorAt(junction.p[1], tMs / 1000);
            const rfAmp = Math.hypot(...rf), loAmp = Math.hypot(...lo);
            const product = [rf[0] * lo[0] + rf[1] * lo[1], rf[1] * lo[0] - rf[0] * lo[1]];
            return {
                centreHz: band.hz, rf, lo, rfAmp, loAmp, product,
                transmitterBcAmp: transmitter ? Math.hypot(...band.phasorAt(transmitter.p[1] ?? transmitter.p[0], tMs / 1000)) : null,
                mixerAudio: mixerRfGain(bias.card.gm, bias.iT, rfAmp) * mixerLoGain(bias.vlo, loAmp) * product[0] / 4,
                rfPhaseHz: (band.phaseRateAt?.(junction.p[0], tMs / 1000) ?? NaN) / (2 * Math.PI),
                loPhaseHz: (band.phaseRateAt?.(junction.p[1], tMs / 1000) ?? NaN) / (2 * Math.PI),
                k: band.k, implicitSteps: band.integ.implicitSteps ?? 0,
            };
        });
        const strongest = bands.reduce((a, b) => a.rfAmp * a.loAmp >= b.rfAmp * b.loAmp ? a : b);
        rows.push({ tMs, ...Object.fromEntries(Object.entries(observed).map(([key, id]) => [key, board.nodeVoltages.get(id) ?? 0])),
            phase: Math.atan2(strongest.product[1], strongest.product[0]),
            bands, mixerAudio: bands.reduce((sum, b) => sum + b.mixerAudio, 0) });
        if ((i + 1) % 100 === 0) console.log(JSON.stringify({ progressMs: tMs }));
    }
} catch (error) {
    failure = { message: error.message, transient: board.transientAnalysisStatus().failure, radio: board._radio?.error ?? null };
    process.exitCode = 1;
}

const summary = {};
if (rows.length >= 3) {
    const amplitudes = key => rows.map(r => Math.max(...r.bands.map(b => b[key] ?? 0)));
    const range = values => ({ min: Math.min(...values), max: Math.max(...values) });
    summary.rf = range(amplitudes('rfAmp'));
    summary.lo = range(amplitudes('loAmp'));
    summary.transmitterBc = range(amplitudes('transmitterBcAmp'));
    const relativePhaseRates = rows.map(row => {
        const band = row.bands.reduce((a, b) => a.rfAmp * a.loAmp >= b.rfAmp * b.loAmp ? a : b);
        return Math.abs(band.rfPhaseHz - band.loPhaseHz);
    });
    const ratesObserved = relativePhaseRates.every(Number.isFinite);
    const maximumRelativePhaseHz = ratesObserved ? Math.max(...relativePhaseRates) : null;
    const nyquistHz = 1 / (2 * metadata.dtMs / 1000);
    summary.phaseSampling = { nyquistHz, maximumRelativePhaseHz, ratesObserved };
    summary.phase = summary.rf.min <= 1e-6 || summary.lo.min <= 1e-6
        ? { unavailable: 'the input carrier or LO is below the observation floor; noise phase is not a tone' }
        : !ratesObserved
            ? { unavailable: 'relative phase rates are unavailable, so the sampling alias bound cannot be checked' }
            : maximumRelativePhaseHz >= nyquistHz
                ? { unavailable: 'the relative phase rate exceeds the sampling Nyquist bound; the sampled phase slope aliases' }
                : phaseBeat(rows);
    for (const field of ['speaker', 'amplifier', 'amplifierInput', 'mixerOutput', 'mixerAudio']) {
        const values = rows.map(r => r[field]), mean = values.reduce((a, b) => a + b, 0) / values.length;
        let count = 0;
        for (let i = 1; i < values.length; i++) if ((values[i - 1] - mean) * (values[i] - mean) < 0) count++;
        let periodic;
        try { periodic = periodicTone(rows, field); } catch (error) { periodic = { unavailable: error.message }; }
        summary[field] = { min: Math.min(...values), max: Math.max(...values), mean, periodic,
            wholeWindowCrossings: count,
            wholeWindowHz: count / 2 / ((rows.at(-1).tMs - rows[0].tMs) / 1000) };
    }
}
const result = { metadata, failure, summary, rows };
writeFileSync(outputPath, JSON.stringify(result) + '\n');
console.log(JSON.stringify({ outputPath, failure, summary }));
