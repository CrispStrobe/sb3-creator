# lab-hum-counter — expected behaviour

## Circuit
- 5 V supply. A bare wire near mains wiring (`field_probe_3`, source mains, up to 5 pF of coupling, knob = how close) on the clock input A of a 74HC93 4-bit binary counter (`74hc93_5`), with 10 MΩ from that input to ground.
- QA feeds clock input B, so the four outputs count in binary; each lights a red LED through 1 kΩ.
- RESET (`button_6`) takes both reset inputs high (10 kΩ pull-down).

## Observable behaviour
- Wire near the mains (knob 0.8): the count rises by 50 per second (it wraps after 15).
- RESET clears it.
- Wire far away (knob 0): no counting.

## Measured on the engine
bw-board r9/engine-robust-20261125 / bw-circuit-ui e3441d2, `test/lab-circuits-r9.test.mjs`.

| wire | counts in 200 ms |
|---|---|
| near (0.8) | 10 |
| far (0) | 0 (in 100 ms) |

## What this verifies
1. A few picofarads to the mains put several volts of hum on a 10 MΩ input.
2. A high-impedance counter input counts it: 50 counts per second.

```assert
net 74hc93_5.vcc V 5.0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **5 of this page's 8** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-hum-counter` prints them one by one.
<!-- engine-provenance -->
