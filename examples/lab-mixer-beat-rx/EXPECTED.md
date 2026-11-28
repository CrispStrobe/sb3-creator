# lab-mixer-beat-rx — expected behaviour

## Circuit
- A double-balanced mixer IC (SA612 type) on 6 V. A wire antenna (the bench's three medium-wave stations: 612, 810 and 1215 kHz) goes straight into input A through 100 pF; input B is bypassed by 100 nF.
- The chip's own oscillator transistor in a tapped-coil oscillator: the ferrite rod's main winding (250 µH, its own pickup off) with the tuning capacitor across it (authored 0.45, about 660 kHz), its top to the oscillator base through 10 nF, the tap feeding the emitter back through 10 nF.
- Output A through 10 nF into a crystal earphone.

## Observable behaviour
- Tuned between stations (0.45): the oscillator runs, but nothing is near it: silence.
- Tuned near the 612 kHz station (0.53): a whistle of about 1 kHz — the difference between the oscillator and the station.
- A little further (0.535): the whistle rises to about 3 kHz. Through zero beat the pitch falls, growls and rises again on the other side.

## Measured on the engine
bw-board RF envelope bands (the oscillator and the station in one band; the sa612 turns their product into audio), `test/lab-circuits-r7mix.test.mjs`, 2 ms to settle, then 3 ms at the earphone: 0.53 → 1003 Hz, 0.175 V peak-to-peak; 0.535 → 3010 Hz, 0.19 V; 0.45 → 0.039 V (switch-on settling, no tone).

## What this verifies
1. A mixer with a local oscillator turns any station near it into a tone at their difference frequency (heterodyne reception).
2. The pitch follows the tuning: it is the difference, not either frequency.

```assert
# both inputs on the chip's internal bias (0.23 × 6 V)
net sa612_6.in_a V 1.38 +-0.02
net sa612_6.in_b V 1.38 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **5 of this page's 19** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mixer-beat-rx` prints them one by one.
<!-- engine-provenance -->
