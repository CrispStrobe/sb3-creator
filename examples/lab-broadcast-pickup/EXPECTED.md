# lab-broadcast-pickup — expected behaviour

## Circuit
- 9 V battery, 100 µF across the supply. LM386: +IN on a 30 cm bare wire (`antenna`, height 0.3 m, about 10 pF to its surroundings, no earth), −IN on ground, 10 µF across pins 1–8 (gain 200), BYPASS 10 µF to ground, the output through 220 µF into an 8 Ω loudspeaker.
- The wire's broadcast: one strong local station at 1 MHz, 0.1 V/m, 80 % AM with a 400 Hz tone.

## Observable behaviour
- The loudspeaker plays the station's 400 Hz tone, loud (about 0.12 A rms).
- With the field lowered to 0.01 V/m the tone is barely there (about 8 mA rms, the amplifier's idle level): the input junction rectifies with the square of a small swing.

## Measured on the engine
bw-board RF envelope front end (an LM386 input as a detector: the PNP follower's mean base–emitter voltage drops by Vt·ln I0 of the RF swing at its base, taken whole as an upper bound), `test/lab-circuits-rf.test.mjs` after 60 ms: 0.1 V/m 400 Hz at > 0.05 A rms; 0.01 V/m less than a fifth of that.

## What this verifies
1. Any junction rectifies RF; an audio amplifier's input stage demodulates a strong AM station.
2. Junction detection is square-law for small signals.

```assert
# supply
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d5501af` and `bw-circuit-ui@0efc30a` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-broadcast-pickup` prints them one by one.
<!-- engine-provenance -->
