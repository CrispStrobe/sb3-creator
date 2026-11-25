# lab-led-colour-blind — expected behaviour

## Circuit
- 9 V supply. Two lamps: a red LED (`led_5`) and a green LED (`led_8`), each with 470 Ω on its own switch (`switch_3`, `switch_6`). As built the red lamp is on.
- Two LEDs used backwards as light receivers, a red one (`led_9`) and a green one (`led_10`), sit in a dark box (no room light) 2 cm from both lamps (four `light_path` parts, air, 2 cm).
- A slide switch (`slide_switch_11`) connects the cathode of one receiver to the − input of an LM358 (`lm358_12`); its anode is on ground, the + input is grounded and 1 MΩ runs from the output to the − input: a transimpedance amplifier, output = photocurrent × 1 MΩ, less about 43 mV for the LM358's own input bias current (out of the − input, through the same 1 MΩ). A meter (5 V) shows the output.

## Observable behaviour
- Red lamp, red receiver: 0.41 V.
- Red lamp, green receiver: nothing (5 mV, the amplifier's floor).
- Green lamp, red receiver: 0.85 V.
- Green lamp, green receiver: 0.12 V.

## Measured on the engine
bw-board with op-amp input bias (r12) / bw-circuit-ui 3084f35, `test/lab-circuits-r6f.test.mjs`.

| lamp | red receiver | green receiver |
|---|---|---|
| off | 0.005 V | 0.005 V |
| red | 0.409 V | 0.005 V |
| green | 0.846 V | 0.120 V |

## What this verifies
1. A photon can only free a charge carrier in the LED's junction if its energy is at least the junction's band gap. The red LED's gap is smaller than the green LED's, so green photons (more energy) are enough for it, red photons are not enough for the green one.
2. An LED receives its own colour only weakly: its emission lies at the very edge of what it absorbs.

## Simulation notes
The optics model (bw-board optics.js) weights an LED receiver's photocurrent by a response that falls off steeply above its own emission wavelength minus 15 nm (red 640 nm, green 568 nm), so the selectivity comes from the model of the junction, not from a rule written for this bench. The receivers' room light is set to 0 (the dark box); the room light on an LED receiver is not colour-weighted unless a spectrum is given.

```assert
# as built: red lamp on, red receiver selected: 0.45 uA x 1 MOhm, less the
# - input's bias current (42.5 nA) x 1 MOhm
net lm358_12.1_out V 0.409 +-0.02
net vsource_2.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@e744ede` and `bw-circuit-ui@3084f35` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 17** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-led-colour-blind` prints them one by one.
<!-- engine-provenance -->
