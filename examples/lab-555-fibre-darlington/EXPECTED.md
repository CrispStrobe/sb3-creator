# lab-555-fibre-darlington — expected behaviour

## Circuit
- 9 V supply. A red LED (470 Ω, 15.2 mA) shines into a 0.5 m light guide (light_path_23); its knob is the gap between the fibre's far end and a phototransistor (phototransistor_5), 0 to 10 mm.
- The phototransistor feeds the base of an NPN (npn_6; 10 MΩ base to emitter): a photo-Darlington.
- The slide switch (slide_switch_8) sends the Darlington's emitter current to one of two 555s. Left, SWITCH: into 10 kΩ (resistor_9), the tied trigger/threshold of a 555 Schmitt trigger (timer_555_10); the green NEAR LED (led_13) lights when its output is low, the red FAR LED (led_15) when it is high. Right, TONE: through 22 kΩ (resistor_16) into the discharge-pin node of a 555 astable (timer_555_17; 47 kΩ, 1 kΩ, 22 nF) on a piezo.

## Observable behaviour
- SWITCH: Darlington emitter 0.52 V at 10 mm, 1.39 V at 6 mm, 2.84 V at 4 mm (FAR lit); 7.99 V at 2 mm, 8.27 V at 1 mm, 8.28 V touching (NEAR lit).
- TONE: 2080 Hz at 10 mm, 3405 Hz at 4 mm, 3448 Hz touching.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: emitter 0.515 / 1.391 / 2.836 / 7.992 / 8.267 / 8.279 V at 10 / 6 / 4 / 2 / 1 / 0 mm; tone 2080.4 / 3404.8 / 3448.3 Hz at 10 / 4 / 0 mm.

## What this verifies
1. Light through a fibre falls off steeply with the gap at its end; a phototransistor alone gives microamps, the NPN after it multiplies that by about a hundred, enough to drive 10 kΩ through the 555's whole window.
2. The Schmitt 555 turns the gradual change into a clean switch with a gap between NEAR (from 2 mm) and FAR (from 4 mm).
3. Extra current into the astable's charging path shortens each charge: the pitch rises as the fibre end comes closer. During the discharge the 555's discharge pin shorts that node, so the light does not slow the other half of the cycle.

## Simulation notes
The phototransistor is set to 20 µA at full light (`iMax`): with 0.5 mA, as on the single-transistor fibre benches, the Darlington saturates at every gap. Without the 10 MΩ from base to emitter the NPN's base has no DC path but the phototransistor and floats up to the supply in the dark.

```assert
# switch-on, fibre end 10 mm away: Darlington emitter low, FAR lit, NEAR dark
net npn_6.emitter V 0.515 +-0.03
net timer_555_10.output V 8.653 +-0.03
net led_15.anode V 1.72 +-0.05
net led_13.anode V 9.0 +-0.01
```
