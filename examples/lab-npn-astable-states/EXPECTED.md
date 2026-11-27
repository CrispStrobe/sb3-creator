# lab-npn-astable-states — expected behaviour

## Circuit
9 V. A two-transistor astable: `npn_3` with the red LED (`led_6`) and 470 Ω (`resistor_5`) in its collector, `npn_4` with the green LED (`led_8`) and 470 Ω (`resistor_7`). Base resistors 47 kΩ (`resistor_9`, `resistor_10`), coupling electrolytics 10 µF (`polarized_cap_11` from `npn_3`'s collector to `npn_4`'s base, `polarized_cap_12` the other way). Switches, as authored: **EN1** (`switch_13`) and **EN2** (`switch_14`) closed, in the two emitter leads; **HOLD** (`switch_15`) closed, in series with `polarized_cap_11`; **DARK** (`switch_16`) open, across the red LED.

## Observable behaviour
| switches | red | green |
|---|---|---|
| all as authored | blinks | blinks (in turn), period about 0.6 s |
| DARK closed | dark (bypassed) | blinks |
| HOLD open | on | on |
| EN1 open | off | on |
| EN1 and EN2 open | off | off |
| EN2 open only | on | off |

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6a.test.mjs`, sampling every 20 ms: as authored 10 red and 10 green switchings in 3 s, red lit about half the time; DARK: green 6 switchings in 2 s, red 0; HOLD open: both lit at every sample; EN1 open: green at every sample, red at none; both open: neither.

## What this verifies
1. The astable needs both cross-couplings: without one, nothing switches either transistor off.
2. Each half needs its own current path; a dead half leaves the other one simply on.
3. One circuit, a few switches: five distinguishable status signals.

```assert
# t = 1 ms: the red half has won the power-on race
net vsource_2.pos V 9.00 +-0.01
net npn_3.collector V 0.03 +-0.02
net npn_3.base V 0.81 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **4 of this page's 9** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-npn-astable-states` prints them one by one.
<!-- engine-provenance -->
