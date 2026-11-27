# lab-mixer-metal-detector — expected behaviour

## Circuit
- 6 V. A Colpitts search oscillator around a hand-wound coil (30 turns, 10 cm across): 22 nF collector-to-emitter, 220 nF emitter-to-ground, 4.7 kΩ emitter resistor, base on 22 k / 10 k held by 100 nF. It runs near 96 kHz.
- A wire from its collector runs past the receiver: 4.7 pF onto the mixer IC's input A (input B bypassed by 100 nF).
- The mixer's own oscillator: a second ferrite coil (272 µH, its pickup off) with 10 nF and the tuning capacitor across it, top to the oscillator base through 10 nF, tap to the emitter through 10 nF — about 94–97 kHz over the knob (authored 0.5).
- Output A into a crystal earphone with 22 nF across it.

## Observable behaviour
- No metal, tuning at 0.5: a tone of about 500 Hz, the difference between the two oscillators.
- A coin flat on the search coil (Metal slider at 0 cm): its inductance drops, the search oscillator rises, and the tone jumps to about 3 kHz.
- Tuning at 0.3: the two oscillators almost meet — zero beat, no tone, only a slow wobble.

## Measured on the engine
bw-board RF envelope bands (both oscillators in one band; the sa612 turns their product into audio), `test/lab-circuits-r7mix.test.mjs`, 3 ms to settle, then 4 ms at the earphone: 0.5 → 501 Hz, 77 mV peak-to-peak; with the coin → 3008 Hz, 57 mV; 0.3 → the oscillators 9 Hz apart, 15 mV.

## What this verifies
1. Two oscillators mixed give their difference frequency, so a small change of one becomes a large change of pitch.
2. Metal near a coil changes its inductance and with it the oscillator's frequency.

```assert
# both mixer inputs on the chip's internal bias (0.23 × 6 V)
net sa612_13.in_a V 1.38 +-0.02
net sa612_13.in_b V 1.38 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 24** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mixer-metal-detector` prints them one by one.
<!-- engine-provenance -->
