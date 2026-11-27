# lab-mirror-thermo-alarm — expected behaviour

## Circuit
- 9 V supply. A current mirror of two NPN with exponential junctions: Q1 diode-connected (collector tied to base) with 82 kΩ from +9 V, Q2 sharing its base. Each transistor sits in its own surroundings (a Temperature slider each, 25 °C as built, 1 s thermal time constant).
- Q2's collector load: 4.7 kΩ plus a 22 kΩ trimmer (at half). Through 100 kΩ it drives a kill NPN on the + input of the LM386 tone oscillator (47 kΩ / 100 kΩ, 1 nF, 10 kΩ and 100 nF; speaker through 47 µF and 47 Ω).

## Observable behaviour
- Both at room temperature: Q2 copies Q1's current, its collector sits at 6.5 V, the kill NPN conducts: silence.
- Q2 in the fingers (33 °C): 5.3 V, still silent. Q2 in hot water (70 °C): it needs less base voltage, carries several times the current, its collector falls to 0.06 V, the kill NPN lets go: alarm. Moving Q2 from 25 °C into hot water, the alarm starts after about 0.7 s, at about 47 °C.
- Q1 cooled instead (frost warner): 10 °C gives 3.6 V, silent; ice water (0 °C) sounds the alarm — a colder Q1 sets a higher base voltage, which is the same as a warmer Q2.
- Both in hot water, or both in ice: 6.5 V, silent. The mirror only sees the DIFFERENCE: if both transistors are in the same surroundings, warming of the whole circuit cancels.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs` (each case loaded with the transistors already in their surroundings): Q2 collector 6.50 V (both 25 °C), 5.34 V (Q2 33 °C), 6.48 V (both 70 °C), 3.57 V (Q1 10 °C), all silent; Q2 at 70 °C: 0.06 V and a 616.0 Hz tone; Q1 at 0 °C: 0.10 V and 616.0 Hz. Q2 moved from 25 °C into 70 °C water: alarm after 660 ms, at 46.8 °C.

## What this verifies
1. A junction's voltage at a given current falls about two thousandths of a volt per kelvin, and a current mirror turns a temperature difference into a large current ratio.
2. Matched transistors in the same surroundings cancel drift.

## Simulation notes
The thermal model gives each transistor its own surroundings (surroundC) with a 1 s time constant; the base-emitter voltage moves by two thousandths of a volt per kelvin.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_5.collector V 6.50 +-0.03
net npn_4.base V 0.60 +-0.005
net lm386_10.inp V 0.035 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 46** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mirror-thermo-alarm` prints them one by one.
<!-- engine-provenance -->
