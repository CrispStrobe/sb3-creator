# lab-mixer-points — expected behaviour

## Circuit
- A double-balanced mixer IC (SA612 type) on 6 V, used at DC. Its two inputs sit on an internal bias (0.23 of the supply) through 1.5 kΩ each; its outputs hang on 1.5 kΩ each from the supply, and its 1 mA tail current is steered between them by the product of tanh(input) and tanh(LO).
- An LM386 relaxation oscillator (output → 2.2 µF → +IN, 22 kΩ to ground; −IN grounded) drives input A through 4.7 kΩ; input B sits on a 10 k / 10 k half-supply divider through 4.7 kΩ.
- The LO pin (the oscillator transistor's base, biased internally through 18 kΩ) is pulled down by 10 kΩ; the STEER button pulls it up through 4.7 kΩ.
- Each output drives a PNP through 2.2 kΩ whose emitter sits a diode below the supply: the lamp lights only when that output takes most of the tail current (the 1.5 kΩ load drops more than ~1.3 V). Red on output A, green on output B.

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
# the LO pin pulled low against its internal bias (18 kΩ to 1.62 V vs 10 kΩ to ground)
net sa612_6.osc_b V 0.579 +-0.02
# input B on the half-supply divider against the input bias (1.38 V through 1.5 kΩ)
net sa612_6.in_b V 1.597 +-0.02
```
