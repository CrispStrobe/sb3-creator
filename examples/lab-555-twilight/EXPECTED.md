# lab-555-twilight — expected behaviour

## Circuit
- 9 V supply. Phototransistor (phototransistor_3; 0.5 mA at full light) from +9 V into 22 kΩ (resistor_4) to ground. That node is the tied trigger and threshold of a 555 (timer_555_5): a Schmitt trigger at 3 V and 6 V.
- Output → 1 kΩ → yellow LAMP LED (led_10) → ground; +9 V → 1 kΩ → green DAY LED (led_12) → output.
- NARROW (switch_7): 10 kΩ (resistor_8) from the control pin to ground.

## Observable behaviour
- As built (light 0.1, dusk): input 1.1 V, output high (8.66 V), LAMP lit (6.75 mA).
- Brightening: DAY lights at light 0.55 (input 6.05 V, above 6 V); darkening: LAMP lights again at light 0.25 (input 2.75 V, below 3 V).
- NARROW closed: the control pin drops to 4.5 V; DAY now at light 0.425 (input 4.68 V), LAMP at 0.2 (input 2.2 V).

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: switching light levels 0.550 / 0.250 (wide) and 0.425 / 0.200 (narrow), stepping the light slider by 0.025; full light would give 0.5 mA × 22 kΩ = 11 V, so the thresholds sit at 6/11, 3/11, 4.5/11 and 2.25/11 of full light.

## What this verifies
1. The phototransistor's current, and so the input voltage, is proportional to the light (0.5 mA × light × 22 kΩ).
2. The switch-on and switch-off light levels differ by the 555's hysteresis (CV and CV/2).
3. A resistor on the control pin lowers CV from 6 V to 4.5 V and the window from 3 V to 2.25 V.

## Simulation notes
The light slider sets the phototransistor's illumination directly (0..1).

```assert
# dusk (light 0.1): input low, output high, LAMP on, DAY off
net timer_555_5.trigger V 1.1 +-0.02
net timer_555_5.output V 8.663 +-0.03
net led_10.anode V 1.917 +-0.05
net led_12.anode V 9.0 +-0.01
```
