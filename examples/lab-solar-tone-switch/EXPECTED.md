# lab-solar-tone-switch — expected behaviour

## Circuit
- 9 V supply. A small solar cell (`solar_cell_3`, params voc 0.5 and isc 0.001: a small cell; light slider at 0.5) drives the base of `npn_8` through 4.7 kΩ.
- A slide switch (`slide_switch_4`) puts the cell's negative end either on ground (position 0, no bias) or on the wiper of a bias pot (`potentiometer_6`, 10 kΩ under 100 kΩ from +9 V, about 0.41 V unloaded at mid travel; position 1).
- `npn_8`'s collector (22 kΩ to +9 V) feeds `npn_11`'s base through 22 kΩ; `npn_11` holds the timing node of an LM386 tone oscillator (`lm386_12`) at ground while it conducts.
- The oscillator: 1 MΩ / 1 MΩ positive feedback, 220 kΩ / 47 nF timing, gain 200, 220 µF to the speaker.

## Observable behaviour
- No bias: even full light gives only 0.5 V, too little for the base; silent.
- Bias on, dark: still silent.
- Bias on, light: the switch transistor conducts, the second one lets go and the speaker sounds about 490 Hz. An acoustic light detector.

## Measured on the engine
bw-board d4113b4b / bw-circuit-ui 0b594d6, `test/lab-circuits-r6i.test.mjs`, 3 ms after loading.

| bias | light | cell | `npn_8` base | `npn_8` collector | sound |
|---|---|---|---|---|---|
| off | 1.0 | 0.500 V | 0.500 V | 4.84 V | none |
| on | 0 | 0 V | — | 4.84 V | none |
| on | 0.5 | 0.474 V | 0.680 V | 0.08 V | 493 Hz |

## What this verifies
1. A silicon solar cell's 0.5 V cannot open a silicon base-emitter junction; the same cell in series with a bias just below the threshold can.
2. The second transistor inverts the switch, so light starts the LM386 relaxation oscillator.

## Simulation notes
The solar cell's `voc` and `isc` params describe a small cell so the light, not the cell's voltage alone, decides.

```assert
# t = 1 ms, no bias, light 0.5
net solar_cell_3.pos V 0.476 +-0.01
net npn_8.collector V 4.84 +-0.1
net npn_11.collector V 0.02 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@d21d6d8` and `bw-circuit-ui@d9e0982` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **20 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-solar-tone-switch` prints them one by one.
<!-- engine-provenance -->
