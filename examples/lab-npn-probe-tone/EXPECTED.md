# lab-npn-probe-tone — expected behaviour

## Circuit
9 V (`vsource_2`). Shared tone stage: `npn_3` (Q1) and `npn_4` (Q2) form an astable, each with 2.2 kΩ to +9 V in its collector (`resistor_5`, `resistor_6`); `capacitor_7` couples Q1's collector to Q2's base, `capacitor_8` Q2's collector to Q1's base. A third NPN (Q3) gets Q2's collector through 10 kΩ and switches the magnetic earphone (2 kΩ, 0.1 H) with a 1N4148 across it for the coil's kick. Each half stays off for about 0.69 · R · C, R being the resistor that recharges the capacitor on its base. Here Q1's collector resistor is 10 kΩ (`resistor_5`), Q2's collector has a yellow LED (`led_19`) in series with its 2.2 kΩ (`resistor_6`), Q3 is `npn_16`, the earphone `earphone_17`. Q2's half: 47 kΩ (`resistor_8`) and 2.2 nF (`capacitor_7`). Q1's coupling capacitor is chosen by **HIGH** (`slide_switch_9`): 10 nF (`capacitor_10`, position 0) or 1 nF (`capacitor_11`, position 1). Q1's base is fed through a 22 kΩ guard (`resistor_12`), the **PROBES** switch (`switch_13`, open as authored) and the **MATERIAL** pot (`potentiometer_14`, 1 MΩ as a rheostat, position 0.047 = 47 kΩ, a piece of fruit).

## Observable behaviour
- Probes apart (an insulator): Q1's base is never recharged, the earphone is silent and the LED is steadily lit (about 3.2 mA: Q2 conducts all the time).
- Probes closed: the lower the material's resistance, the higher the pitch.

| MATERIAL | resistance | pitch | LED lit for |
|---|---|---|---|
| 0 (metal) | 0 | about 5.2 kHz | 74 % of each cycle |
| 0.047 (fruit) | 47 kΩ | about 2.25 kHz | 89 % |
| 0.2 (wet paper, damp skin) | 200 kΩ | about 790 Hz | 96 % |
| 1 (dry skin) | 1 MΩ | about 181 Hz | 99 % |

- The LED is lit while Q2 conducts, that is while Q1 is held off; that share of each cycle grows with the resistance, so the LED is brighter as the pitch falls.
- HIGH with fruit: about 9.7 kHz, a shrill whistle.
- By the formula: Q1 off for 0.69 · (22 kΩ + R) · 10 nF, Q2 off for 0.69 · 47 kΩ · 2.2 nF = 71 µs; fruit gives 2.15 kHz.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`: 5196 Hz, 2254 Hz, 793 Hz, 180.7 Hz; the LED's average current over each window, against the 3.21 it carries when steadily lit, gives the shares in the table; HIGH with fruit 9746 Hz.

## What this verifies
1. Conductors and insulators differ in how much they resist; the oscillator turns that into a pitch (continuity tester, rain alarm, skin resistance).
2. f falls as the timing resistance grows.

## Simulation notes
The MATERIAL pot stands in for whatever is between the tips; the engine has no fruit, blotting paper or skin. Wetting paper or sweating palms is turning MATERIAL down.

```assert
# t = 1 ms, probes apart: Q2 on (LED lit), the earphone driver off
net npn_4.collector V 0.08 +-0.03
net npn_16.collector V 9.00 +-0.02
net npn_3.collector V 9.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **16 of this page's 39** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-probe-tone` prints them one by one.
<!-- engine-provenance -->
