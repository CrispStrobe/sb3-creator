# lab-wobble-astable — expected behaviour

## Circuit
- 9 V battery. Slow astable from the LM386 (gain 20, pins 1/8 and bypass open): 470 kΩ from the output to +IN (with the chip's internal 50 kΩ to ground: positive feedback), 470 kΩ from a 470 nF timing capacitor to −IN. The output charges the capacitor quickly through a diode and 10 kΩ and lets it discharge slowly through 100 kΩ: short high pulses, long low gaps (about 45 ms per cycle).
- Fast astable from two NPN: 1 kΩ collector loads (a piezo across the second), 47 nF cross capacitors, 47 kΩ base resistors. The base resistors return to a control node (2.2 µF to ground, 22 kΩ from 9 V), not to 9 V.
- The LM386's output reaches the control node through a diode.

## Observable behaviour
- Every LM386 pulse charges the control node at once to about 7.6 V; between pulses it falls slowly through the base resistors to about 4.9 V — a sawtooth, repeating about every 45 ms.
- The astable's pitch follows the node: about 265 Hz just after a pulse, sliding down to about 210 Hz before the next — a falling, repeating sweep (the "wobbling" siren-like tone).

## Measured on the engine
bw-board f4aaec43 (unchanged on b094eb22), `test/lab-circuits-r7b.test.mjs` (40 samples every 2.5 ms after 10 ms): node 4.88–7.60 V, 2 steps up and 35 down; pitch 210–265 Hz in the repeating cycles (306 Hz in the first sample).

## What this verifies
1. An amplifier IC with positive feedback and an RC is an astable.
2. The voltage a transistor astable's base resistors return to sets its frequency; a diode and capacitor turn pulses into a sawtooth sweep.

```assert
# power-on: supply and the LM386's bias divider
net vsource_2.pos V 9.00 +-0.01
net lm386_3.bypass V 4.58 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 25** numeric claims against that engine
> (1 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-wobble-astable` prints them one by one.
<!-- engine-provenance -->
