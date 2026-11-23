# The radio that switches on at dawn

A wake-up radio from two circuits you know: the one-transistor receiver, and a light switch. A second transistor sits in the receiver's ground return; a light-dependent resistor turns it on when light falls on it. In the dark the radio is off and draws almost nothing; in the morning light it plays.

**Teaches:** a transistor as a switch, combining a sensor with a load, standby current

## What to do

Click **Sim**. The bench starts in the dark: the earphone is silent. Raise the light on the LDR slowly and listen.

## What you should see

- Dark: no sound, the receiver's transistor carries no current.
- Bright: the 612 kHz station's 400 Hz tone in the earphone, as loud as in the one-transistor radio.
- In between there is a short range where the switch is half on and the sound is weak.

## Why it works

The LDR and the 47 kΩ form a voltage divider at the switch transistor's base. In the dark the LDR is about 1 MΩ, the base sits near 0 V and the switch is off: the receiver's emitter has no path to ground. Light brings the LDR down to about 1 kΩ, the base rises above 0.7 V, the switch saturates and connects the receiver's emitter to ground, and the receiver works as usual.
