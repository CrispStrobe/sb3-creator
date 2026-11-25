# lab-mosfet-field — expected behaviour

## Circuit
- 9 V supply. An n-MOSFET (threshold 2 V), source to ground, drain through a green LED and 1 kΩ to +9 V.
- The gate carries only a field probe: a longer bare wire (20 pF of its own to the room) near a rubbed ruler at 2 kV, 0.1 pF of coupling at the closest. The knob is the ruler's distance; a turn moves the ruler over 0.2 s.

## Observable behaviour
- No ruler: LED off.
- Knob at 0.3: the gate rises to about 2.26 V, past the threshold, and the LED is fully on (about 7 mA).
- Held there for a second: the gate keeps its voltage and the LED stays on.
- Knob back to 0: gate near 0 V, LED off.

## Measured on the engine
Knob 0.3: gate 2.26 V, LED 7.15 mA; one second later still 2.26 V. Knob 0: gate below 0.2 V. `test/lab-circuits-fields.test.mjs` holds these.

## Why
No current flows into a MOSFET gate. The charge the ruler induces stays on the wire and the gate as long as the ruler stays (the insulation leak is a teraohm), so the gate voltage stays.

## What this verifies
1. A gate holds an induced charge.
2. A MOSFET responds to where the charge is, not only to its movement.

```assert
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **7 of this page's 15** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-mosfet-field` prints them one by one.
<!-- engine-provenance -->
