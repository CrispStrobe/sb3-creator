# Busy-signal beeps

A telephone's busy signal is a tone switched fully on and off: beep, pause, beep. Here two transistors blink slowly, and while the first one is on, a diode clamps the power amplifier's timing capacitor so its tone stops. The green LED lights with each beep.

**Teaches:** gating an oscillator, a diode clamp, a slow oscillator controlling a fast one

## What to do

Click **Sim**, listen and watch the green LED.

## What you should see

- Beeps of about 690 Hz, each about 0.3 s long, with pauses of the same length.
- The green LED is lit during each beep and dark in the pauses.

## Why it works

The tone oscillator needs its capacitor to swing between two switching points. While the first transistor is on, its collector is almost at 0 V, and the diode holds the capacitor down at about 0.7 V: it can never reach the upper switching point and the oscillator stops. When the transistor switches off, the diode lets go and the tone runs.
