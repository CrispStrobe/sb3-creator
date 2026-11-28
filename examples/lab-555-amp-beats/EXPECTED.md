# lab-555-amp-beats — expected behaviour

## Circuit
- 9 V supply. A 555 astable (timer_555_3): 1 kΩ, 15 kΩ, 100 nF, about 460 Hz.
- An LM386 relaxation oscillator (lm386_8): 47 kΩ from its output and 100 kΩ from +9 V give its + input a threshold that moves with the output; 2.2 kΩ plus a 15 kΩ TUNE rheostat (potentiometer_13, as built at 0.35) charge 100 nF on its − input.
- Each output goes through 10 kΩ into one mixing node (10 kΩ to ground); 10 µF couples the mix into a crystal earphone.

## Observable behaviour
- As built: 555 at 460 Hz, LM386 oscillator at 513 Hz: the mix swells and fades 52 times a second, a fluttering tone.
- The two outputs agree (both high or both low) 94 % of one 555 period at the swells and only 7 % at the fades; the fades are 19.5 ms apart.
- TUNE lower brings the LM386 closer to 460 Hz (452 Hz at 0.25, 481 Hz at 0.3): the beat slows down and, at equal pitch, stops.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs` over 45 ms: 460.4 Hz and 513.1 Hz; out of step at 9.5 ms and 29.1 ms. An earlier sweep of TUNE measured 452.0 / 480.8 / 512.8 Hz at 0.25 / 0.30 / 0.35.

## What this verifies
1. Two oscillators of different kinds, close in frequency, drift in and out of step at the difference of their frequencies: 1 / (513.1 − 460.4 Hz) = 19.0 ms, against 19.5 ms between fades (the windows are one 555 period, 2.17 ms, wide).
2. In step the mix swings fully; out of step the two cancel and it hovers in the middle: that is the beat.

## Simulation notes
Every LM386 flip costs the solver hundreds of steps, so the bench is authored with a fast beat (about 52 Hz) that shows two fades within 45 ms; the slow beats at TUNE near 0.25 are described, not measured over seconds.

```assert
# switch-on: 555 output high, the LM386 oscillator's output high and its moving threshold up
net timer_555_3.output V 8.984 +-0.03
net lm386_8.vout V 8.1 +-0.05
net lm386_8.inp V 5.116 +-0.03
net timer_555_3.control V 6.0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 34** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-amp-beats` prints them one by one.
<!-- engine-provenance -->
