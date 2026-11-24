# lab-ramp-timer — expected behaviour

## Circuit
- 9 V. One half of an LM358 (`lm358_3`) integrates onto 4.7 µF. Its + input sits near 1 V (82 kΩ / 10 kΩ). The second half is parked.
- The input resistor is 47 kΩ plus a 220 kΩ "time" rheostat (as loaded at zero, the fastest setting). A hold/run slide switch (`slide_switch_6`) connects it either to the same 1 V (hold) or to ground (run, as loaded).
- **Zero**: a button with 100 Ω across the capacitor.
- Three NPN stages watch the ramp, each through a divider to 1 kΩ: 3.3 kΩ (green), 6.2 kΩ (yellow), 9.1 kΩ (red) on top. Each LED has 1 kΩ in series from +9 V.

## Observable behaviour
- Run (as loaded): the output climbs from about 1 V in a straight line; at the fastest setting it takes about 1.5 s to reach the top.
- Green comes on after about 0.45 s, yellow after about 0.9 s, red after about 1.35 s: the three thresholds are equally spaced in voltage, and on a straight ramp that makes them equally spaced in time.
- Switch to hold: the ramp stops where it is and the lit LEDs stay lit.
- **Zero**: back to the start, all LEDs dark. Switch back to run and it starts again.
- Time knob at half (157 kΩ in all): a third of the speed; fully slow (267 kΩ) about a sixth.

## What this verifies
1. A constant input current into an integrator gives a ramp, a straight line in time.
2. Thresholds on a straight ramp are equally spaced marks of time: a timer.
3. The ramp speed is the input voltage divided by R·C.

```assert
# 1 ms after switch-on, running: the + input near 1 V; the output a few
# millivolts above it already, and one stage's divider following it
net lm358_3.1_pos V 0.978 +-0.005
net lm358_3.1_out V 0.9827 +-0.0015
net npn_14.base V 0.2285 +-0.003
net slide_switch_6.com V 0.00 +-0.001
```
