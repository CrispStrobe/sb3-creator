# lab-diff-pair-charging — expected behaviour

## Circuit
- 9 V supply. Two NPN with exponential junctions share 820 Ω to ground; each collector has 1 kΩ to +9 V.
- Q1's base is a 47 µF electrolytic charging through 47 kΩ from +9 V (the EMPTY button discharges it through 100 Ω). Q2's base is the reference: half the supply from two 10 kΩ.
- Between the collectors: 220 Ω and two LEDs back to back (red with its anode on Q1's side, green the other way).

## Observable behaviour
- Capacitor below half: Q2 carries the current, Q1's collector is higher: red lit.
- As the capacitor passes the reference (after about 1.5 s) the collectors are level: both dark.
- Above: green.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs` (current through the 220 Ω, positive = red): +1.28 mA from switch-on to 1.25 s (capacitor 3.89 V); none at 1.5 s (capacitor 4.43 V); from 1.75 s on it flows the other way (green), growing as the capacitor climbs to 5.52 V, where Q1's base holds it. The button empties the capacitor and red returns at +1.28 mA.

## What this verifies
1. A differential pair compares two voltages; the sign of the difference picks the LED.
2. Back-to-back LEDs between two collectors show the difference, dark at balance.

## Simulation notes
Measured headless on the committed circuit; `test/lab-circuits-r6c.test.mjs` replays the learner's controls.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_9.base V 0.004 +-0.01
net npn_10.base V 4.35 +-0.02
net npn_9.collector V 7.72 +-0.05
net npn_10.collector V 5.85 +-0.05
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-diff-pair-charging` prints them one by one.
<!-- engine-provenance -->
