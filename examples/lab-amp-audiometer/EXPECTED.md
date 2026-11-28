# lab-amp-audiometer — expected behaviour

## Circuit
- 9 V supply. The LM386 relaxation oscillator (47 kΩ / 100 kΩ on the + input, 1 nF speed-up) with 22 nF on the − input; its timing resistor is 1.2 kΩ plus a 25 kΩ rheostat (the pitch knob). Speaker through 47 µF and 47 Ω.

## Observable behaviour
- Knob at 0 (26 kΩ in the path): about 770 Hz. At half: about 2 kHz. At 1 (1.2 kΩ): about 12.8 kHz, where many adults hear little or nothing.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: knob 0: 774.9 Hz; 0.5: 1982.5 Hz; 1: 12768 Hz.

## What this verifies
1. The timing resistance sweeps an RC oscillator over more than a decade.
2. The upper end of hearing can be found by ear on a marked scale.

## Simulation notes
At the top of the sweep each half period is under 40 µs; the amplifier's 1 V/µs slew rate rounds the edges.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm386_3.vout V 0.90 +-0.03
net lm386_3.inp V 2.12 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-audiometer` prints them one by one.
<!-- engine-provenance -->
