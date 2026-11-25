# What sets a Schmitt trigger's window

A Schmitt trigger switches on at one voltage and off at a lower one. The ratio of two resistors sets the gap — and a high-resistance source sneaks its own resistance into that ratio unless a buffer keeps it out.

**Teaches:** hysteresis, feedback ratio, source resistance, buffer stage

## What to do

Click **Sim**. Turn the INPUT knob (potentiometer_3) slowly up until the red LED (led_13) lights, then down until it goes out, and note both readings on voltmeter_14. Repeat with WIDTH (slide_switch_7) on the right, then both again with BUFFER (slide_switch_5) on the left.

## What you should see

- Buffered: a window of about 1.5 V with 47 kΩ, about 4.8 V with 15 kΩ.
- Without the buffer the window is much wider (about 5 V and 7.6 V): almost the whole output swing.

## Why it works

The op-amp's output pulls its own + input up or down through the feedback resistor, so the input has to go further to undo it; the gap is the output swing times the input resistor divided by the feedback resistor. The knob's own resistance is in series with the input resistor, so without the follower it makes the input resistor look bigger.
