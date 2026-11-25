# lab-brake-light-check — expected behaviour

## Circuit
- 9 V supply. The brake pedal (`button_3`) feeds the brake lamp, a red LED (`led_10`) with 470 Ω, through a slide switch (`slide_switch_8`: bulb OK as built, or blown). 10 kΩ pulls the pedal line down when it is released.
- A light guide (`light_path_29`, fibre, 2 m) carries the lamp's light to a phototransistor (`phototransistor_11`). Through 10 kΩ it switches an NPN (`npn_14`) whose collector, with 10 kΩ to +9 V and 1 µF to ground, is the DARK signal: high while no light arrives.
- The pedal line reaches gate 1 of a `cd4093` (Schmitt NAND) through 10 kΩ and 1 µF, a diode across the resistor lets it fall at once on release: the lamp gets 10 ms to light before it is checked.
- Gate 1 = NAND(pedal, dark) sets a latch made of gates 2 and 3. A power-on pulse (100 kΩ, 100 nF) and the reset button (`button_20`) reset it. The latch's Q drives an NPN and a red LED (fault), its other output an NPN and a green LED (OK), each with 1 kΩ.

## Observable behaviour
- Power on or reset: green.
- Pedal pressed with a good lamp: the lamp lights, the light comes back through the fibre, green stays.
- Pedal pressed with the bulb blown: no light comes back, the latch sets: red, and it stays red after the pedal is released.
- Reset button: green again.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| step | latch Q | red LED | green LED |
|---|---|---|---|
| after reset | low | 0.69 V (off) | 2.02 V (on) |
| pedal, good lamp | low | off | on |
| pedal, blown lamp, released | high | 1.72 V (on) | 0.99 V (off) |
| reset | low | off | on |

## What this verifies
1. A set/reset latch from two NAND gates stores an event until it is reset.
2. A check must wait for what it checks: the RC delay gives the lamp time to light before "pedal pressed and dark" counts as a fault, and the diode removes the delay on release, when the lamp goes dark first.

## Simulation notes
The 1 µF on the DARK line slows its rise when the lamp goes out, so the pedal line (falling at once through the diode) always wins that race.

```assert
# t = 1 ms: power-on reset has left the latch in the OK state
net cd4093_17.3y V 8.96 +-0.1
net cd4093_17.2y V 0.00 +-0.1
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **11 of this page's 18** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-brake-light-check` prints them one by one.
<!-- engine-provenance -->
