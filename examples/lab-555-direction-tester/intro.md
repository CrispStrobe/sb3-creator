# Direction tester with a 555 tone

A tone that sounds only when current can flow from the red probe to the black one. Put diodes, an LED and transistors in the socket and find out which way round they conduct, and whether a transistor is an NPN or a PNP.

**Teaches:** diode direction, NPN and PNP, the 555's reset pin

## What to do

Click **Sim**. Press one socket button at a time: the diode (button_13), the red LED (button_15), the NPN (button_17) or the PNP (button_19). Then move both clip switches (slide_switch_11 and slide_switch_12) to the right to swap the probes and try again. Finally hold the diode button, close LEAK (switch_21) and turn the rheostat (potentiometer_23).

## What you should see

- Probes forward: the diode, the LED and the NPN beep; the PNP stays silent.
- Probes swapped: only the PNP beeps.
- LEAK: the tone rises from about 680 Hz to about 980 Hz as you turn the rheostat down.

## Why it works

The tone generator only runs while its reset pin is high. The black probe is that pin: it only goes high if current flows through the part from the red probe. A diode passes current from its anode to its cathode; in an NPN the base is the anode side, in a PNP the cathode side. A leak from the control pin to ground lowers the voltages the timer switches at, so it switches sooner and the tone gets higher.
