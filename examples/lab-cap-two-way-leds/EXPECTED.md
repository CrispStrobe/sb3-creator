# lab-cap-two-way-leds — expected behaviour

## Circuit
- 9 V battery. Slide switch (slide_switch_3): left (CHARGE, as built) to +9 V, right (DISCHARGE) to ground.
- From the switch: 470 Ω, then a red LED (led_6) and a green LED (led_7) wired anti-parallel, then a 470 µF electrolytic to ground.
- A magnetic earphone (earphone_5) across the 470 Ω.

## Observable behaviour
- Switch-on at CHARGE: the red LED flashes and fades within about half a second while the capacitor charges.
- Slide to DISCHARGE: the green LED flashes and fades the same way; the red one stays dark.
- Each throw clicks in the earphone, which sees the step across the 470 Ω.
- The capacitor stops near 7 V on charge and near 2 V on discharge: below about 1.8 V across the LEDs no current flows.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: switch-on at CHARGE, then at 20 ms 13.6 mA into the capacitor (red LED 1.86 V) and at 0.8 s 0.27 mA; slid to DISCHARGE, then at 20 ms −10.0 mA (green LED 2.10 V) and at 0.8 s −0.22 mA, the capacitor left at 1.91 V.

## What this verifies
1. A capacitor's current reverses between charging and discharging: each LED shows one direction.
2. The current is largest at the moment of switching and falls off exponentially (time constant 470 Ω × 470 µF ≈ 0.22 s, stretched by the LED drop).

## Simulation notes
The capacitor never empties completely through the LEDs: once the voltage across them falls below their threshold the current stops, so about 2 V stay behind. The earphone is a 2 kΩ coil with 0.1 H; its click is the step of several volts across the resistor at each throw.

```assert
# 1 ms after switch-on at CHARGE: the capacitor still empty, the red LED conducting
net slide_switch_3.com V 9.00 +-0.02
net resistor_4.b V 1.92 +-0.1
net polarized_cap_8.pos V 0.04 +-0.03
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@9de91e3` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 26** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-cap-two-way-leds` prints them one by one.
<!-- engine-provenance -->
