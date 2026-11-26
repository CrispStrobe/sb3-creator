# lab-555-humidity-switch — expected behaviour

## Circuit
- 9 V supply. A 555 (timer_555_5) with trigger and threshold tied together: a Schmitt trigger that switches its output low above two thirds of the supply and high below one third (the control pin has 10 nF).
- Its input is a divider: the salt-film humidity comb (humidity_comb_3) from +9 V, 100 kΩ (resistor_4) to ground.
- Output → 1 kΩ → green DRY LED (led_10) → ground; +9 V → 1 kΩ → blue WET LED (led_8) → output.

## Observable behaviour
- Room air (50 % RH, the comb about 10 MΩ): input 0.09 V, output high (8.67 V), DRY lit (6.65 mA).
- Breath on the comb (90 % RH, a few kΩ): input 8.6 V, output low (0.29 V), WET lit (5.81 mA).
- Drying back to 74 % RH: the input is 4.5 V, inside the window, and WET stays lit. At 65 % RH the input is 1.36 V and DRY comes back.
- From DRY, 74 % RH keeps DRY; 80 % RH (input 6.84 V) switches to WET. Between about 70 and 77 % RH the switch keeps what it was doing.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: input 0.089 / 8.601 / 4.500 / 1.359 / 6.838 V at 50 / 90 / 74 / 65 / 80 % RH; output 8.667 V high, 0.290 V low.

## What this verifies
1. The comb's resistance falls steeply with humidity (about a decade per 12 % RH), so the divider moves the input across the whole 0–9 V range.
2. The 555 Schmitt trigger has two switching points: at 74 % RH the same input (4.5 V) leaves the output high or low depending on where it came from.

## Simulation notes
The comb model is the film's resistance only; it has no drying time, so the learner moves the humidity slider back by hand. The 555's inputs draw no current, so the divider is unloaded.

```assert
# room air (50 % RH): input low, output high, DRY LED lit
net timer_555_5.trigger V 0.089 +-0.01
net timer_555_5.output V 8.667 +-0.03
net led_10.anode V 2.015 +-0.05
net timer_555_5.control V 6.0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f48ea7c` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **5 of this page's 32** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-humidity-switch` prints them one by one.
<!-- engine-provenance -->
