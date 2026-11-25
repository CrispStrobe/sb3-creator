# Diode tester with a beeper

A beeper sounds whenever current can flow from the red probe to the black one. Put a diode between them and it tells you which way the diode conducts — no meter needed.

**Teaches:** diode direction, forward voltage, continuity testing

## What to do

Click **Sim**. Both slide switches start on the left: the red probe on the anode row, the black probe on the cathode row. Hold one of the four buttons (button_20 silicon diode, button_22 germanium diode, button_24 red LED, button_26 infrared LED) and listen; read the voltmeter (voltmeter_28). Then move both slide switches (slide_switch_18 red probe, slide_switch_19 black probe) to the right and try the four buttons again. Finally leave the black one on the right and move the red one back to the left.

## What you should see

- Forward (both switches left): every diode beeps, and the meter shows its own drop: about 0.55 V for silicon, 0.3 V for germanium, 0.95 V for the infrared LED and 1.5 V for the red LED, which glows faintly.
- Reversed (both right): silence, for all four.
- Both probes on the same row: the beeper sounds with nothing in the socket — the probes are touching.

## Why it works

The tone generator is held silent by a transistor. A second transistor can switch that one off, but only if a little current arrives from the red probe (4.5 V) through whatever is between the probes. A diode lets that current through in one direction only.
