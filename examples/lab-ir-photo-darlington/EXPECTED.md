# lab-ir-photo-darlington — expected behaviour

## Circuit
- 9 V battery. IR LED (ir_transmitter_4) with 330 Ω, facing a phototransistor (phototransistor_5) across air; the light path (light_path_12) has the distance as its control (1 to 30 cm; 2 cm as built).
- RECEIVER slide switch (slide_switch_6), left (as built): the phototransistor's current goes straight through 220 Ω and a red LED (led_8).
- Right: it feeds the base of an NPN instead (a photo-Darlington), with a green LED (led_11) and 470 Ω in its collector.
- The phototransistor's own light slider is the room light.

## Observable behaviour
- Phototransistor alone: the red LED is bright at 1 cm, dim at 2 cm, barely glowing at 5 cm, dark from 10 cm.
- Photo-Darlington: the green LED is fully on up to 10 cm and still clearly lit at 20–30 cm.
- At 30 cm a little room light (light 0.01) is enough to light the Darlington's LED; the phototransistor alone ignores it.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: distance stepped 1 / 2 / 5 / 10 cm, alone: 14.8 / 4.0 / 0.66 / 0.17 mA; stepped on with the Darlington: 14.3 mA at 10 cm, 4.1 mA at 20 cm, 1.83 mA at 30 cm; first 30 cm, then room light 0.01: alone 0.068 mA, Darlington 6.8 mA.

## What this verifies
1. The light reaching the phototransistor falls steeply with distance; alone it can light an LED only at close range.
2. A second transistor multiplies its current by its gain: range goes up tenfold, and so does the sensitivity to stray light.

## Simulation notes
The phototransistor's light slider adds room light to the light path's infrared. No base resistor on the Darlington, for the full sensitivity the row describes.

```assert
# 1 ms after switch-on, 2 cm, phototransistor alone
net ir_transmitter_4.anode V 1.34 +-0.03
net phototransistor_5.emitter V 2.55 +-0.1
net resistor_7.b V 1.67 +-0.05
net resistor_10.b V 9.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@0f6b38a` and `bw-circuit-ui@42aaddc` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **4 of this page's 10** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ir-photo-darlington` prints them one by one.
<!-- engine-provenance -->
