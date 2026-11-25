# lab-tone-mux — expected behaviour

## Circuit
- 5 V supply, two 74HC132 quad Schmitt NAND gates.
- First chip: gate 1 with 22 kΩ / 100 nF is the low tone, gate 2 with 10 kΩ / 100 nF the high tone, gate 3 with 220 kΩ / 1 µF a slow oscillator; gate 4, its inputs joined, inverts the select line S.
- Second chip: gate 1 = NAND(low tone, S), gate 2 = NAND(high tone, inverted S), gate 3 joins them: low tone while S is high, high tone while S is low. Its output drives a piezo through 1 kΩ. Gate 4 is unused.
- S comes from a slide switch: left (position 0, as authored) the slow oscillator; right, 10 kΩ to +5 V and the KEY button to ground.
- A yellow LED with 470 Ω from +5 V into the inverted S lights while S is high.

## Observable behaviour
- Switch right, KEY released: S is high, the line carries the low tone, about 570 Hz.
- KEY pressed: S is low, the line carries the high tone, about 1.25 kHz.
- Switch left: the slow oscillator flips S about 5.7 times a second, a little more than half the time high, and the two tones take turns on the one line.

## Measured on the engine
Switch right: S 5.0 V, line 568 Hz; KEY pressed: 1247 Hz. Switch left: S changes state 3 times in the first 400 ms (at 176, 272 and 351 ms), high 64 % of that time. `test/lab-circuits-r6d.test.mjs` holds these.

## What this verifies
1. Three NAND gates and an inverter make a two-way selector.
2. Switching it with a clock shares one line between two signals in turns.

```assert
# t = 1 ms: slow oscillator just started, S high
net vsource_2.pos V 5.00 +-0.01
net slide_switch_10.com V 5.00 +-0.02
net 74hc132_3.4y V 0.30 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **13 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-tone-mux` prints them one by one.
<!-- engine-provenance -->
