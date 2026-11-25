# lab-amp-classes — expected behaviour

## Circuit
- 9 V supply. A function generator (1 kHz sine, 1.5 V peak) through the LEVEL pot (10 kΩ, fully up as authored) feeds two NPN stages.
- Class A: 47 kΩ / 10 kΩ bias the base, the signal arrives through 22 kΩ and 470 nF; 4.7 kΩ collector, 1 kΩ emitter resistor.
- Class C: no bias; the signal reaches the base through 4.7 kΩ with 47 kΩ to ground; 1 kΩ and a red LED in the collector.

## Observable behaviour
- Class A: the transistor carries current all the way round the cycle; its collector swings around its resting point.
- Class C: it conducts only while the signal is past about 0.7 V: about a third of each cycle at full level. The red LED flickers on the peaks.
- LEVEL at 0.6: class A still conducts all the time, class C for a smaller share of each cycle. LEVEL at 0.4: class C never reaches its threshold; class A carries on.
- Class AB (two transistors sharing the cycle) is in lab-push-pull.

## Measured on the engine
Share of samples with more than 10 µA (400 samples over 2 ms after 80 ms): class A 1.000 at LEVEL 1, 0.6 and 0.4; class C 0.335 at LEVEL 1, 0.145 at 0.6, 0.000 at 0.4. `test/lab-circuits-r6d.test.mjs` holds these.

## What this verifies
1. A biased stage conducts for the whole cycle (class A).
2. An unbiased stage conducts only on the peaks, less than half the cycle (class C), and the share depends on the signal's size.

```assert
# t = 1 ms: class A bias still settling, class C idle
net vsource_2.pos V 9.00 +-0.01
net npn_9.base V 1.15 +-0.05
net npn_9.emitter V 0.47 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **12 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-amp-classes` prints them one by one.
<!-- engine-provenance -->
