import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phaseBeat, periodicTone } from './helpers/mixer-beat.mjs';

function waveform({ beat = 3862.2, chirp = 0, audio = beat, reverse = false } = {}) {
    return Array.from({ length: 300 }, (_, k) => {
        const tMs = 8.01 + k * 0.01, t = tMs / 1000;
        // Independent analytic carriers: the common 790 kHz frame cancels.
        const a = 2 * Math.PI * (2700 * t + chirp * (t - 0.008) ** 2 / 2);
        const b = 2 * Math.PI * ((2700 + beat) * t);
        const rf = [Math.cos(a), Math.sin(a)], lo = [Math.cos(b), Math.sin(b)];
        const phase = Math.atan2((reverse ? -1 : 1) * (rf[1] * lo[0] - rf[0] * lo[1]), rf[0] * lo[0] + rf[1] * lo[1]);
        // DC offset and symmetric amplifier clipping change amplitude and
        // harmonics, but they do not change the complete-period frequency.
        const speaker = 0.4 + Math.max(-1, Math.min(1, 3 * Math.sin(2 * Math.PI * audio * t + 0.7)));
        return { tMs, phase, speaker };
    });
}

test('mixer metrics recover the independently specified beat across phase wraps and clipped audio', () => {
    for (const reverse of [false, true]) {
        const trace = waveform({ reverse });
        const phase = phaseBeat(trace), audio = periodicTone(trace, 'speaker');
        assert(Math.abs(phase.hz - 3862.2) < 1e-8);
        assert(phase.phaseRms < 1e-10);
        assert(Math.abs(audio.hz - 3862.2) < 2);
        assert(audio.jitter < 0.02);
        assert(audio.cycles >= 8);
    }
});

test('a changed audio tone and a drifting carrier cannot masquerade as a stable matched beat', () => {
    const wrongAudio = waveform({ audio: 1800 });
    assert(Math.abs(periodicTone(wrongAudio, 'speaker').hz - phaseBeat(wrongAudio).hz) > 1500,
        'the output is checked independently of the RF phase');
    const drifting = phaseBeat(waveform({ chirp: 1e6 }));
    assert(drifting.phaseRms > 1, 'the phase-line residual exposes a nonstationary source');
    assert.throws(() => periodicTone(wrongAudio.map(x => ({ ...x, speaker: 3 })), 'speaker'), /enough complete/,
        'a saturated amplifier is not evidence of a tone');
});
