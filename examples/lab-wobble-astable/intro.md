# An amplifier chip sweeps a transistor astable

Two oscillators. The amplifier chip, with feedback to its own input, flips slowly — about twenty times a second. A two-transistor astable sings through a piezo, but its base resistors are not tied to the battery: they hang from a capacitor that the chip's pulses charge through a diode.

**Teaches:** an amplifier IC as an astable, frequency set by bias, making a sawtooth with a diode and a capacitor

## What to do

Click **Sim** and listen to the piezo. Watch the voltage on the 2.2 µF capacitor (the control node).

## What you should see

- The control node jumps to about 7.6 V at each pulse of the chip and sinks slowly to about 4.9 V before the next — a sawtooth.
- The tone slides down from about 265 Hz to about 210 Hz and jumps back up, over and over.

## Why it works

Each half of the astable's cycle lasts as long as a capacitor needs to recharge through a base resistor, and it recharges faster the higher the voltage the resistor returns to. The diode lets the chip's pulse fill the control capacitor at once but stops it from emptying it again: only the base resistors drain it, slowly. So the voltage — and the pitch — rises in a jump and falls in a slope.
