# lab-amp-ic-light-tone — expected behaviour

## Circuit
- 9 V battery, one LM386 (pins 1, 7, 8 open) as a Schmitt-trigger tone oscillator:
  - output → 47 kΩ → +IN, battery + → 47 kΩ → +IN (with the chip's own input resistance to ground): +IN higher while the output is high than while it is low;
  - timing: output → 10 kΩ → −IN, and the timing capacitor from −IN to ground, picked by a slide switch: 100 nF (as authored) or 470 nF;
  - a phototransistor from the output (collector) to −IN (emitter), in parallel with the 10 kΩ: light adds charging current.
- Output → 47 µF (+) → 47 Ω → loudspeaker → ground.

## Observable behaviour
- In the dark a tone of about 680 Hz.
- Light on the phototransistor raises the pitch steeply: about 1.7 kHz at light 0.3, about 1.9 kHz at full light. Waving a hand over it makes the tone swoop up and down (a quacking sound).
- The larger capacitor lowers every pitch about five times.

## Measured on the engine
Speaker pitch from 8 ms to 20 ms after switch-on:

| light | capacitor | pitch |
|---|---|---|
| 0 | 100 nF | 678 Hz |
| 0.3 | 100 nF | 1672 Hz |
| 1 | 100 nF | 1898 Hz |
| 0.3 | 470 nF | 354 Hz |

## What this verifies
1. A phototransistor is a light-controlled current that can charge a timing capacitor.
2. Faster charging gives a higher pitch; a larger capacitor a lower one.

## Simulation notes
The phototransistor conducts only from collector to emitter, so it helps while the output is high (charging) and is reverse-biased while it is low. `test/lab-circuits-r6b.test.mjs` sets the light slider and reads the pitch from the speaker.

```assert
# t = 1 ms, dark: output high, the capacitor charging towards the upper switching point.
net lm386_3.vout V 8.075 +-0.05
net lm386_3.inp V 5.808 +-0.05
net lm386_3.inn V 4.693 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 22** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-ic-light-tone` prints them one by one.
<!-- engine-provenance -->
