# lab-555-touch-toggle — expected behaviour

## Circuit
- 9 V supply. 555 (timer_555_3) with trigger and threshold on one node, held at half the supply by two 1 MΩ (resistor_5, resistor_6): between its thresholds at one third and two thirds, so it keeps its state.
- The output charges a 1 µF steering capacitor (polarized_cap_8) through 100 kΩ (resistor_7).
- TOUCH (button_9): a fingertip, 220 kΩ of skin (resistor_10), from the capacitor to the input node.
- The output drives a red LED (1 kΩ) and a relay coil (relay_13, flyback diode).

## Observable behaviour
- Switched on: output low, LED off, input node 4.5 V.
- Each short touch (40 ms) flips the output: on (6.99 V, relay pulled in), off, on.
- A finger left on keeps flipping it: on for about 0.45 s, off for about 0.11 s.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: after three taps 6.988 V / 0 V / 6.988 V; held from 1.62 s, the output changed at 1.732, 2.186, 2.294, 2.749 and 2.856 s.

## What this verifies
1. The capacitor stores the output's state: full (output high) it pulls the node above 6 V and the 555 switches low; empty (output low) it pulls the node below 3 V and the 555 switches high.
2. One input, two comparators: the stored charge decides which comparator a touch reaches.
3. With the finger left on, the capacitor recharges from the new output through the finger and flips it again: a blinker.

## Simulation notes
The output high is 6.99 V rather than 9 V: the relay coil (200 Ω) loads the 555's 50 Ω output. The blink is uneven because the capacitor charges through 100 kΩ from the output but the finger's 220 kΩ and the 1 MΩ divider also load it.

```assert
# switched on: node between the thresholds, output low, capacitor empty
net timer_555_3.trigger V 4.5 +-0.01
net timer_555_3.output V 0 +-0.01
net polarized_cap_8.pos V 0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **6 of this page's 25** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-touch-toggle` prints them one by one.
<!-- engine-provenance -->
