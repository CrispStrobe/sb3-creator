import assert from 'node:assert/strict';

/** Read existing RF history only: observing a carrier must not advance it. */
export function mixerCarriers(board, partId, tSec, transmitterId = null) {
    const radio = board._radio;
    const detector = radio?.detectors.find(d => d.kind === 'mixer' && d.partId === partId);
    assert(detector, `mixer detector exists for ${partId}`);
    const junction = radio._mixerJ.get(detector.index);
    const transmitter = transmitterId === null ? null
        : radio._sys.junctions.find(j => j.kind === 'bjt' && j.d.partId === transmitterId);
    assert(transmitterId === null || transmitter, `transmitter junction exists for ${transmitterId}`);
    const bands = radio._bands.map(band => {
        const rf = band.phasorAt(junction.p[0], tSec);
        const lo = band.phasorAt(junction.p[1], tSec);
        const rfAmplitude = Math.hypot(...rf), loAmplitude = Math.hypot(...lo);
        return {
            rfAmplitude, loAmplitude,
            transmitterSwing: transmitter ? Math.hypot(...band.phasorAt(transmitter.p[1] ?? transmitter.p[0], tSec)) : 0,
            phase: Math.atan2(rf[1] * lo[0] - rf[0] * lo[1], rf[0] * lo[0] + rf[1] * lo[1]),
            weight: rfAmplitude * loAmplitude,
        };
    });
    assert(bands.length, 'the mixer has an RF band');
    const common = bands.reduce((a, b) => a.weight >= b.weight ? a : b);
    return {
        ...common,
        // These maxima also distinguish a far-detuned live carrier (a
        // different band) from a disconnected RF input.
        rfPeak: Math.max(...bands.map(b => b.rfAmplitude)),
        loPeak: Math.max(...bands.map(b => b.loAmplitude)),
        transmitterSwing: Math.max(...bands.map(b => b.transmitterSwing)),
    };
}

/** Frequency and phase-line residual of arg(RF * conjugate(LO)). */
export function phaseBeat(trace) {
    assert(trace.length >= 3, 'a phase trace needs at least three samples');
    const samples = [{ t: trace[0].tMs / 1000, phase: trace[0].phase }];
    for (let i = 1; i < trace.length; i++) {
        const d = trace[i].phase - trace[i - 1].phase;
        samples.push({ t: trace[i].tMs / 1000,
            phase: samples[i - 1].phase + Math.atan2(Math.sin(d), Math.cos(d)) });
    }
    const meanTime = samples.reduce((s, x) => s + x.t, 0) / samples.length;
    const meanPhase = samples.reduce((s, x) => s + x.phase, 0) / samples.length;
    let numerator = 0, denominator = 0;
    for (const x of samples) {
        numerator += (x.t - meanTime) * (x.phase - meanPhase);
        denominator += (x.t - meanTime) ** 2;
    }
    assert(denominator > 0, 'the phase trace covers elapsed time');
    const slope = numerator / denominator;
    const residual = samples.map(x => x.phase - meanPhase - slope * (x.t - meanTime));
    return { hz: Math.abs(slope / (2 * Math.PI)),
        phaseRms: Math.sqrt(residual.reduce((s, x) => s + x * x, 0) / samples.length) };
}

/**
 * Measure complete periods between interpolated rising crossings. Counting
 * all sign changes over the whole window includes incomplete end cycles and
 * can mistake an amplifier's power-on recovery for an RF difference tone.
 */
export function periodicTone(trace, field) {
    const mean = trace.reduce((s, x) => s + x[field], 0) / trace.length;
    const crossings = [];
    for (let i = 1; i < trace.length; i++) {
        const a = trace[i - 1][field] - mean, b = trace[i][field] - mean;
        if (a < 0 && b >= 0) crossings.push((trace[i - 1].tMs
            + (trace[i].tMs - trace[i - 1].tMs) * -a / (b - a)) / 1000);
    }
    assert(crossings.length >= 3, `${field}: enough complete rising periods`);
    const period = (crossings.at(-1) - crossings[0]) / (crossings.length - 1);
    let jitter = 0;
    for (let i = 1; i < crossings.length; i++) jitter = Math.max(jitter, Math.abs((crossings[i] - crossings[i - 1]) / period - 1));
    return { hz: 1 / period, jitter, cycles: crossings.length - 1 };
}
