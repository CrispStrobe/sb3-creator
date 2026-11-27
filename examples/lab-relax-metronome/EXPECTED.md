# lab-relax-metronome — expected behaviour

## Circuit
- 9 V battery. A PNP and an NPN form a latch: PNP base held at 82 % of the supply by 2.2 kΩ / 10 kΩ (also the NPN's collector); PNP collector into the NPN's base (220 kΩ to its emitter).
- The timing capacitor on the PNP's emitter charges through 27 kΩ plus the 220 kΩ RATE rheostat (potentiometer_4, half way as built). TONE slide switch (slide_switch_5): left 4.7 µF (as built), right 47 nF.
- The latch dumps the capacitor through the red LED (led_13) and the loudspeaker (speaker_15); 1 kΩ from the NPN's emitter to ground.

## Observable behaviour
- TICK (4.7 µF): one click and one flash per period: about every 0.25 s with the knob up, every 2.3 s with it down, every 1.25 s half way.
- TONE (47 nF): the same circuit buzzes, about 340 Hz with the knob up, falling to some 40 Hz with it down.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: 4.7 µF: period 248 ms (knob up), 2270 ms (knob down); a click of 2.3 V peak at the loudspeaker.

At TONE (47 nF), knob up, the loudspeaker plays 344 Hz.

## What this verifies
1. The period is set by the charging time to the trigger point: proportional to R and to C (4.7 µF → 47 nF is a hundredfold).
2. The latch fires at a fixed fraction of the supply and lets go once the capacitor is empty: a home-made unijunction.

## Simulation notes
220 kΩ from the NPN's base to its emitter is a compromise: with 100 kΩ the trickle through the full 247 kΩ cannot start the latch (it needs about 6 µA), with 470 kΩ the latch stays on with the knob up. The clicks are short (well under a millisecond), so a tone readout cannot see them; at TONE the loudspeaker plays a steady buzz.

```assert
# 1 ms after switch-on: trigger point set, capacitor still empty
net pnp_8.base V 7.38 +-0.03
net polarized_cap_6.pos V 0.01 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **10 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-relax-metronome` prints them one by one.
<!-- engine-provenance -->
