# lab-pll-light-tone — expected behaviour

## Circuit
- 9 V supply. A phototransistor (`phototransistor_3`, collector on +9 V) feeds 3.3 kΩ with 100 nF across it; that node is VCO_IN of a 4046 (`cd4046_6`): R1 = 47 kΩ, R2 = 470 kΩ, C1 = 10 nF.
- VCO_OUT reaches an LM386 (`lm386_13`, gain 20, 1 µF on BYPASS) through 100 kΩ and 2.2 kΩ (10 nF across it); 220 µF couples the output to the speaker.
- The phototransistor's light starts at 0.2 (the light slider).

## Observable behaviour
- Light 0.1: about 250 Hz; light 0.2: about 440 Hz; light 0.3: about 640 Hz.
- Brighter light, higher pitch, in proportion.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, 10 ms after each change.

| light | VCO_IN | VCO |
|---|---|---|
| 0.1 | 1.65 V | 248.3 Hz |
| 0.2 | 3.30 V | 443.6 Hz |
| 0.3 | 4.95 V | 639.1 Hz |

## What this verifies
1. The phototransistor's current is proportional to the light (rated 5 mA at full light), so the voltage on 3.3 kΩ is too.
2. The VCO turns that voltage into a pitch: 118 Hz per volt plus 53 Hz from R2.

## Simulation notes
The 1 µF on the LM386's BYPASS pin is needed: without it the simulation could not start with the light already at 0.3 (the step budget ran out in the first millisecond), an engine finding reported with the bench.

```assert
# t = 1 ms, light 0.2
net cd4046_6.vco_in V 3.13 +-0.15
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-pll-light-tone` prints them one by one.
<!-- engine-provenance -->
