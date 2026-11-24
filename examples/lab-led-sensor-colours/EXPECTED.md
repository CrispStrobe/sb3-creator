# lab-led-sensor-colours — expected behaviour

## Circuit
- 9 V battery. Two lamps, each on its own slide switch: a red LED and an IR LED, each through 470 Ω. The red lamp is on as authored, the IR lamp off.
- Two sensors: a red LED and an IR LED, both used backwards (`photoSensitivity` = 5 µA at full light), anodes on ground. Each lamp shines on each sensor from 2 cm (four `light_path` parts, medium air).
- A selector switch connects one sensor's cathode to the inverting input of an LM358 wired as a transimpedance amplifier: 1 MΩ from output to that input, non-inverting input on ground. The output is the photocurrent times 1 MΩ, one volt per microamp; a voltmeter reads it. The LM358's second half is unused, its inputs grounded.

## Observable behaviour
Voltmeter readings (selector at red sensor = position 0, IR sensor = position 1):

| lamps on | red LED sensor | IR LED sensor |
|---|---|---|
| red | 0.45 V | 2.48 V |
| IR | nothing (0.005 V, the amplifier's floor) | 0.56 V |
| both | 0.45 V | 3.04 V |
| none | nothing | nothing |

- The red LED sensor is blind to infrared: switching the IR lamp on adds nothing.
- The IR LED sensor answers both lamps, and with both on the two photocurrents add.
- An LED used as a sensor only responds to light of shorter wavelength (more energetic photons) than the light it would emit itself. Red (640 nm) is shorter than infrared (940 nm), so the IR LED sees red; the red LED cannot see infrared.
- In this model an LED sees its own colour only weakly, so the IR sensor reads the red lamp more strongly than the IR lamp.

## What this verifies
1. An LED is a wavelength-selective light sensor.
2. A transimpedance amplifier turns microamps into volts.

```assert
# Red lamp on, selector on the red LED sensor: its photocurrent x 1 MOhm.
net lm358_12.1_out V 0.452 +-0.01
net lm358_12.1_neg V 0.000 +-0.005
```
