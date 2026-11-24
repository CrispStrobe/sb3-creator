# lab-static-detector — expected behaviour

## Circuit
- 9 V supply. Two NPN transistors as a Darlington pair; both collectors to the LED cathode, the LED anode through 1 kΩ to +9 V, the second emitter to ground.
- The first base carries only a field probe: a bare wire near a rubbed plastic ruler at 10 kV, 0.1 pF of coupling at the closest. The knob is the ruler's distance (0 far, 1 closest); a turn of the knob moves the ruler over 0.2 s.

## Observable behaviour
- No ruler: LED dark.
- Ruler approaching (knob 0 → 1): the LED glows while the ruler moves, about 0.29 mA halfway through the movement, then goes dark again (below 0.01 mA) once the ruler is still.
- Ruler moving away (1 → 0): the LED stays dark; the first base is pushed negative, more than 1 V below ground.

## Measured on the engine
Halfway through the approach 0.29 mA through the LED; 0.25 s after it ended 0.004 mA; while moving away 0 mA with the base near −9 to −15 V. `test/lab-circuits-fields.test.mjs` holds these.

## Why
The ruler's charge induces charge on the wire; the induced charge only changes while the ruler moves, so only then does a current flow into the base: about 1 nC in 0.2 s, a few nanoamps. The pair multiplies it about 40 000 times. Moving away reverses the current, which reverse-biases the base.

## What this verifies
1. Electrostatic induction: current is the rate of change of the induced charge.
2. Darlington gain makes nanoamps visible.

```assert
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d5501af` and `bw-circuit-ui@0efc30a` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **5 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-static-detector` prints them one by one.
<!-- engine-provenance -->
