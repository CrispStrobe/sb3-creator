# lab-auto-dip-beam — expected behaviour

## Circuit
- 9 V supply. A transistor flip-flop: Q1 drives the blue high-beam LED (470 Ω), Q2 the green dipped-beam LED (1 kΩ); cross-coupled through 22 kΩ and 27 kΩ. 1 µF on Q1's base makes Q2 win at switch-on.
- HIGH BEAM grounds Q2's base. A phototransistor (1 mA at full light) from Q1's base to ground watches the road.

## Observable behaviour
- Switch-on: dipped beam (green).
- HIGH BEAM: blue lights and stays lit after the button is released.
- Dusk (light 0.1): nothing happens. An oncoming car (light 0.3): the phototransistor steals Q1's base current, Q2 takes over — dipped. When the car has passed it stays dipped.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r6c.test.mjs`: switch-on Q1 collector 6.18 V, Q2 collector 0.10 V; after the button Q1 collector 0.12 V (high beam); light 0.1: still high beam; light 0.3: Q1 collector 6.18 V, Q2 0.10 V; light 0 again: still dipped.

## What this verifies
1. A flip-flop set by a button and reset by a sensor.
2. A phototransistor as a current-stealing reset: the base drive (about 0.23 mA) sets the light threshold.

## Simulation notes
The phototransistor's light slider stands for the oncoming headlights.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net npn_3.collector V 6.18 +-0.05
net npn_4.collector V 0.096 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 13** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-auto-dip-beam` prints them one by one.
<!-- engine-provenance -->
