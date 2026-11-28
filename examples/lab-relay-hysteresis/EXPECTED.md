# lab-relay-hysteresis — expected behaviour

## Circuit
- 9 V battery. LEVEL (potentiometer_3, 10 kΩ, as built at 0.5) feeds the base of an NPN emitter follower (npn_5) through 1 kΩ; the emitter drives the relay coil (relay_6, 200 Ω) with a 1N4148 across it. voltmeter_8 reads the coil. The relay's params `pullInV` and `dropOutV` set its two thresholds; the test below measures where it actually switches.
- Contacts: common on +9 V; make contact → 1 kΩ → red IN LED (led_13); rest contact → 1 kΩ → green OUT LED (led_15).
- TAP (button_9) joins +9 V through 4.7 µF (capacitor_10) to the base; 100 kΩ empties the capacitor after release.

## Observable behaviour
- As built: coil 3.14 V, relay out, OUT lit.
- LEVEL up in small steps: the relay pulls in when the coil passes 6 V (LEVEL 0.84).
- LEVEL back down: it stays in at LEVEL 0.6 (coil 4.0 V, below pull-in) and lets go only when the coil falls below 2.5 V (LEVEL 0.39).
- LEVEL up again to 0.6 (4.0 V): it stays out. Same coil voltage, opposite state: hysteresis.
- LEVEL 0.5, relay out: one press of TAP lifts the coil to 8.2 V for a few milliseconds; the relay pulls in and holds itself in at 3.1 V after the button is released.

## Measured on the engine
bw-board de8083c5, `test/lab-circuits-thresholds.test.mjs` (LEVEL in steps of 0.01, 6 ms each): pull-in between 5.954 V and 6.054 V of coil, drop-out between 2.505 V and 2.432 V; LEVEL 0.6 reads 3.997 V on the way down (in) and 3.999 V on the way up (out); TAP peak 8.23 V, coil 3.066 V afterwards with the relay in.

## What this verifies
1. A relay's pull-in and drop-out voltages are two different thresholds; between them its state depends on its history.
2. An emitter follower lets a pot drive a low-resistance coil.

## Simulation notes
The relay model switches 5 ms after its coil crosses a threshold.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net relay_6.coil_a V 3.136 +-0.02
net relay_6.nc V 9 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@818e026` and `bw-circuit-ui@659431c` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **23 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-relay-hysteresis` prints them one by one.
<!-- engine-provenance -->
