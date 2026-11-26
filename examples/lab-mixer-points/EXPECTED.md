# lab-mixer-points — expected behaviour

## Circuit
- A double-balanced mixer IC (SA612 type) on 6 V, used at DC. Its two inputs sit on an internal bias (0.23 of the supply) through the chip's own input resistors; its outputs hang on the chip's own load resistors from the supply, and its 1 mA tail current is steered between them by the product of tanh(input) and tanh(LO).
- An LM386 relaxation oscillator (output → 2.2 µF → +IN, 22 kΩ to ground; −IN grounded) drives input A through 4.7 kΩ; input B sits on a 10 k / 10 k half-supply divider through 4.7 kΩ.
- The LO pin (the oscillator transistor's base, biased internally) is pulled down by 10 kΩ; the STEER button pulls it up through 4.7 kΩ.
- Each output drives a PNP through 2.2 kΩ whose emitter sits a diode below the supply: the lamp lights only when that output takes most of the tail current. Red on output A, green on output B.

## Observable behaviour
- The LM386 square wave runs at a few hertz.
- STEER released: oscillator high → green lit, red dark; oscillator low → red lit, green dark. The lamps blink alternately.
- STEER pressed: the same blinking with the roles swapped (oscillator high → red).
- Which signal goes to which input makes no difference: the product of two signs is the same either way round.

## Measured on the engine
bw-board sa612 (src/mixer-ic.js), `test/lab-circuits-r7mix.test.mjs`, 0.7 s with STEER released and 0.7 s pressed, sampled every 10 ms: in at least 80 % of the samples of each oscillator half-cycle the expected lamp alone is lit. With STEER released at 1 ms: LO pin 0.579 V (pulled below its 1.62 V bias), input B 1.597 V, output A 6.00 V (no current) and output B 4.58 V (≈ 0.95 mA).

## What this verifies
1. A double-balanced mixer's output follows the product of its inputs' signs: either input reverses what the other one does.
2. Neither input alone decides the output (balanced).

```assert
# the LO pin pulled low against its internal bias (to 0.27 of the supply) by 10 kΩ to ground
net sa612_6.osc_b V 0.579 +-0.02
# input B on the half-supply divider against the chip's input bias
net sa612_6.in_b V 1.597 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mixer-points` prints them one by one.
<!-- engine-provenance -->
