# lab-opamp-staircase — expected behaviour

## Circuit
- 9 V supply, one LM324.
- Section 1: square-wave clock, a Schmitt trigger (three 10 kΩ, thresholds 3 V / 5.5 V) charging 1 µF (polarized_cap_8) through 100 kΩ: about 7 Hz, green LED (led_10).
- The step capacitor, 1 µF (capacitor_11), from the clock output to a node between two 1N4148: diode_12 to the integrator's summing node, diode_13 to ground.
- Section 2: integrator, 10 µF (polarized_cap_16) from output to − input, + input on 0.3 V (47 kΩ / 1.6 kΩ).
- Section 3: non-inverting Schmitt trigger on the integrator output (10 kΩ in, 22 kΩ back, − input on 2.9 V): switches high at about 4.2 V, low again at about 0.8 V; while high it drives 1 kΩ and diode_21 into the summing node.
- Red LED (led_24, 1 kΩ) and a 6 V meter (analog_meter_25) on the integrator output.

## Observable behaviour
- Every falling edge of the clock lifts the integrator output by the same 0.70 V: 0.93, 1.63, 2.33, 3.03, 3.74 V …; between edges it stays put.
- The next step would pass 4.2 V: section 3 switches, pulls the output down to about 0.9 V within a few milliseconds and lets go. Five steps per cycle, a cycle every 0.72 s.
- The red LED is dark on the first step, then glows brighter on each one; the meter needle climbs in steps and drops back.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs` over 1.7 s: levels 0.296, 0.998, 1.698, 2.398, 3.098, 3.797, then 0.926, 1.626, 2.326, 3.025, 3.74 V; every step 0.70 V (0.699–0.715).

## What this verifies
1. A diode pump moves the same charge on every edge: C × (clock swing − two diode drops) ≈ 1 µF × 7 V; into 10 µF that is a 0.70 V step, whatever the output already is (the integrator keeps the summing node fixed).
2. A comparator with hysteresis turns the staircase into a repeating sequence: count to five, start again.

## Simulation notes
The integrator's + input sits at only 0.3 V: the two pump diodes in series from the summing node to ground then see 0.15 V each and leak nothing between steps. With a higher reference they would conduct continuously and the staircase would become a ramp.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net resistor_14.b V 0.296 +-0.005
net lm324_3.3_neg V 2.878 +-0.01
net lm324_3.1_pos V 5.407 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@2965782` and `bw-circuit-ui@e3441d2` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **18 of this page's 34** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-opamp-staircase` prints them one by one.
<!-- engine-provenance -->
