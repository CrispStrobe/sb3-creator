# lab-tail-light-fibre — expected behaviour

## Circuit
- 9 V supply. The lights switch (`switch_3`) powers everything. The tail lamp is a red LED (`led_6`, 470 Ω) behind a slide switch (`slide_switch_4`: bulb OK as built, or blown).
- A light guide (`light_path_18`, fibre, 2 m, shielded) brings the lamp's light to a phototransistor (`phototransistor_7`, 22 kΩ on its emitter), which drives an NPN (`npn_10`, 10 kΩ base) across the timing capacitor of the warning oscillator.
- The oscillator is an LM386 (`lm386_11`, pins 1 and 8 joined): 1 MΩ from the supply and 1 MΩ from the output on its + input, 220 kΩ and 56 nF from the output on its − input. 220 µF couples it to the speaker.

## Observable behaviour
- Lights off: nothing.
- Lights on, bulb OK: the lamp's light reaches the phototransistor, the capacitor is shorted, silent.
- Bulb blown: no light, a warning tone of about 410 Hz.

## Measured on the engine
bw-board f4aaec43 / bw-circuit-ui 141b2cc, `test/lab-circuits-r6f.test.mjs`, values at about the stated settings (a sequence or a waveform swing, which no single solve stands in for).

| state | oscillator output swing | tone |
|---|---|---|
| lights off | 0.0000006 V | — |
| lights on, bulb OK | 0.019 V | — |
| lights on, bulb blown | 7 V | 413 Hz |

## What this verifies
1. A light guide can bring a lamp's light to where the driver sits, so the lamp itself is checked, not just its wiring.
2. A transistor across an oscillator's timing capacitor is a simple on/off gate.

```assert
# t = 1 ms, lights switch open: nothing is powered
net switch_3.b V 0.00 +-0.03
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@f4aaec4` and `bw-circuit-ui@141b2cc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 14** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-tail-light-fibre` prints them one by one.
<!-- engine-provenance -->
