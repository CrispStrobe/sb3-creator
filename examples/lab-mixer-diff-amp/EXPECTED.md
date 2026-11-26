# lab-mixer-diff-amp — expected behaviour

## Circuit
- 6 V. A 612 kHz AM station (0.005 V/m, 1 kHz tone) in a ferrite-rod tank (antenna on the tap, the rod's own pickup off).
- The coupling winding onto gate 1 of a depletion dual-gate MOSFET; its other end on a 47 k / 33 k divider (about 2.5 V, 100 nF).
- 470 Ω from the source to a stiff reference (330 Ω / 150 Ω across the supply, 100 µF) and 470 Ω from the supply to the drain: a phase splitter. Drain → 100 nF → mixer input A; source → 100 nF → input B.
- Gate 2 on the GAIN pot (10 kΩ across the supply, 100 nF to ground): authored 0.5, gate 2 at half the supply.
- The mixer IC's oscillator base pulled to the supply through 4.7 kΩ: the LO is a steady DC, its switching quad stays in one state, and the chip is a differential amplifier.
- The OUTPUT slide switch takes output A (left) or B (right) through 10 nF to a germanium detector (2.2 nF ‖ 47 kΩ), then 100 nF into the LM386 (10 kΩ at +IN) and an 8 Ω loudspeaker.

## Observable behaviour
- Drain and source carry the station equally, in antiphase; the mixer amplifies their difference about six times; output B carries the same RF as A (upside down), and either one, detected, plays the 1 kHz programme.
- GAIN turned to 1 (gate 2 at 0 V, more than the pinch-off voltage below the channel): the drain current falls from 3.4 mA to 0.09 mA and the RF at the outputs to about half.

## Measured on the engine
bw-board RF envelope front end (the dual-gate MOSFET's halves as RF junctions with their depletion threshold; the sa612's in-band gain gm·⟨tanh(v_lo/2Vt)⟩), `test/lab-circuits-r7mix.test.mjs`, 6 ms, then 1 ms at the detector: GAIN 0.5 → drain/source 15.4 mV each, outputs A/B 0.179/0.183 V, 1 kHz at the detector 6.3 mV; GAIN 1 → drain 8.1 mV, outputs 0.096 V; output B selected → 7.6 mV of 1 kHz.

## What this verifies
1. A phase splitter (equal drain and source resistors) drives a differential input in antiphase.
2. A double-balanced mixer with its LO held still is a differential amplifier; its two outputs are complementary.
3. Gate 2 of a dual-gate MOSFET controls the stage's current and gain.

```assert
# the LO pin pulled towards the supply through 4.7 kΩ against its internal bias: the oscillator is blocked
net sa612_20.osc_b V 5.053 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 36** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mixer-diff-amp` prints them one by one.
<!-- engine-provenance -->
