# lab-555-wail — expected behaviour

## Circuit
- 9 V supply. Tone 555 (timer_555_14): 1 kΩ, 6.8 kΩ, 100 nF on a piezo. Its control pin goes through 1 kΩ (resistor_13) to a RAMP capacitor (polarized_cap_12, 220 µF) charged through 4.7 kΩ (resistor_11).
- The slide switch (slide_switch_8) chooses what drives the ramp. Left, WAIL: a slow 555 astable (timer_555_3; 10 kΩ, 100 kΩ, 10 µF: about 1.5 s per cycle). Right, SIREN: 4.7 kΩ (resistor_10) to +9 V, and the BUTTON (button_9) pulls that to ground.

## Observable behaviour
- SIREN, button up: CV 6.69 V, about 840 Hz. Button held: CV glides down (4.85 V after 0.5 s, 3.84 V after 2 s) and the pitch rises to about 1370 Hz. Released: CV back to 5.39 V after 0.5 s and 6.44 V after 1.5 s; the pitch glides down.
- WAIL: CV rises and falls by itself between about 4.7 V and 6.5 V, about 1.5 s per cycle; the pitch wails with it.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: 840.3 Hz at CV 6.73 V and 1369.9 Hz at CV 3.79 V; the CV traces above sampled every 200 ms.

## What this verifies
1. A 555's control pin sets both thresholds (CV and CV/2). A higher CV makes the capacitor charge further, so the tone gets lower; a lower CV makes it higher.
2. An RC ramp turns a button press or a slow square wave into a slow glide of CV, so the pitch glides instead of jumping.

## Simulation notes
At switch-on the ramp capacitor is empty and holds CV near 1.4 V, so the first second starts high and swoops down. The scenario test measures the pitch with the ramp capacitor cut to 100 nF (so CV settles in milliseconds) and the seconds-long CV glides with the tone capacitor raised to 10 µF (the tone then ticks at about 10 Hz; CV does not depend on it). A 1 kHz tone over several simulated seconds would cost minutes of solver time.

```assert
# switch-on: slow 555 output high, the button side pulled up, CV held low by the empty ramp
net timer_555_3.output V 8.905 +-0.03
net slide_switch_8.b V 9.0 +-0.01
net timer_555_14.control V 1.396 +-0.03
```
