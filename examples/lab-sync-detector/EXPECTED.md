# lab-sync-detector — expected behaviour

## Circuit
- A ferrite-rod tank (250 µH main winding, tuning capacitor at 0.5317) tuned to an AM station at 612 kHz (0.02 V/m, 50 % modulation with a 1 kHz tone); the antenna on the tap, earth on ground. The rod's own pickup is off (`rodHeightM` 0): the antenna brings the station.
- The coupling winding (10 % of the turns) across the mixer IC's inputs A and B (6 V supply).
- The tank's top, through the SYNC switch and 47 pF, onto the mixer's LO pin (its oscillator transistor's base; the emitter is left to its internal resistor, so nothing oscillates).
- Output A through 100 nF into the LM386 (+IN 10 kΩ to ground, −IN grounded, gain 20), 220 µF into an 8 Ω loudspeaker.

## Observable behaviour
- SYNC on: the station's 1 kHz tone from the loudspeaker. The mixer is switched by the station's own carrier, in step with it: each half-wave of the input reaches the output with the same sign, so the output follows the carrier's amplitude — the programme.
- SYNC off: the LO pin has no signal, the mixer stays balanced and the loudspeaker is quiet.

## Measured on the engine
bw-board RF envelope bands with the sa612's same-band product (RF and LO in one band beat straight to audio), `test/lab-circuits-r7mix.test.mjs`: 4 ms to settle, then 3 ms at the speaker. SYNC on: 1 kHz at 0.69 V, tank 0.234 V; SYNC off: 0.054 V at 1 kHz (the amplifier's switch-on settling). At 1 ms: inputs 1.38 V (the internal bias), LO pin 1.58 V.

## What this verifies
1. Mixing a signal with itself (in phase) recovers its envelope: synchronous detection.
2. Without the LO the double-balanced mixer passes nothing.

```assert
# input A on the chip's internal bias (0.23 × 6 V; the coupling winding joins A and B)
net sa612_9.in_a V 1.38 +-0.02
# the LO pin at its own bias, a little below it by the oscillator transistor's base current
net sa612_9.osc_b V 1.580 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 23** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-sync-detector` prints them one by one.
<!-- engine-provenance -->
