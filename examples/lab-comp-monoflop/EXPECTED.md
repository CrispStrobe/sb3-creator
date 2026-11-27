# lab-comp-monoflop — expected behaviour

## Circuit
- 9 V battery. NPN and PNP in a regenerative pair: the NPN's collector pulls the PNP's base down through 10 kΩ (47 kΩ base-emitter); 47 kΩ holds the NPN's base low at rest.
- START (button_3) lifts the NPN's base through 10 kΩ. From the PNP's collector, the 4.7 µF timing capacitor and 100 kΩ feed the NPN's base; LONG (switch_12) adds 220 µF in parallel. 47 kΩ from the PNP's collector to ground.
- ACTIVE: red LED (led_16) with 1 kΩ on the PNP's collector. READY: green LED (led_20) fed through 1 kΩ from +9 V; a third NPN, driven from the PNP's collector through 22 kΩ, shorts it while the timer runs.

## Observable behaviour
- At rest: READY green, ACTIVE dark.
- START: ACTIVE lights, READY goes out, for about 0.8 s.
- With LONG closed: about 37 s.
- Pressing again a second after it has finished gives about the same time (0.75 s).

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: 4.7 µF: 800 ms, then 750 ms on the next press; LONG (220 µF + 4.7 µF): 37.2 s; ACTIVE 7.2 mA; READY 2.02 V across the green LED at rest, 0.09 V while running.

## What this verifies
1. The pair holds itself on only while the timing capacitor still passes enough base current; the time scales with C (4.7 µF → 225 µF: 0.8 s → 37 s).
2. A third transistor inverts the state for a second indicator.

## Simulation notes
The 47 kΩ from the PNP's collector to ground empties the timing capacitor after each run (with 1 MΩ the second press of a pair came out shorter). The LONG run simulates 45 s of DC with large steps, about a minute of computing.

```assert
# 1 ms after switch-on, at rest: PNP off, READY lit
net pnp_8.collector V 0.00 +-0.02
net resistor_19.b V 2.02 +-0.05
net resistor_7.b V 9.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **15 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-comp-monoflop` prints them one by one.
<!-- engine-provenance -->
