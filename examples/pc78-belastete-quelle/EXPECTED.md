# pc78-belastete-quelle — expected behaviour

## Circuit
Battery: EMF = 9 V, r_internal = 2 Ω. Light load path: 1 kΩ + 470 Ω + green LED. Heavy load path: 100 Ω + 470 Ω + red LED.

## Meter readings (measured on the engine)
- **Light path resistance:** 1000 + 470 = 1470 Ω.
- **Heavy path resistance:** 100 + 470 = 570 Ω.
- **Light path current:** (8.9666 − 2.0471) / 1470 = 4.71 mA.
- **Heavy path current:** (8.9666 − 2.1201) / 570 = 12.01 mA.
- **Total current:** I = 4.71 + 12.01 = 16.72 mA.
- **Voltage drop on internal R:** 0.016718 × 2 = 0.0334 V.
- **Terminal voltage:** V_t = 9 − 0.0334 = 8.9666 V.
- **Heavy path gets more current:** brighter LED on that path.

## What this verifies
1. Higher load current → larger internal voltage drop
2. Both loads share the same terminal voltage
3. Battery with high internal R delivers less current to heavy loads
4. **An LED is a voltage drop, not a resistance.** Each branch carries
   (V_t − V_f) / R, so the two forward drops come off the terminal voltage
   before the division. Treating the pair of branches as a plain 410 Ω parallel
   load and dividing the whole 9 V by it is what this page did until the engine
   could solve `rInternal`, and it overstated the current by 30 %.

```assert
# Battery r_internal=2R: terminal V under dual load
net battery_1.pos V 8.96 +-0.20
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@4ae89b5` and `bw-circuit-ui@60fd117` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **14 of this page's 16** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc78-belastete-quelle` prints them one by one.
<!-- engine-provenance -->
