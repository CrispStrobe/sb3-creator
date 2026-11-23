# A tone sent through a light guide

A 555 makes the LED flash at a tone; a light guide carries the flashes to a phototransistor, and an earphone at the far end plays the tone. The two halves of the circuit share only the battery and the light.

**Teaches:** light as a carrier for a signal, AC coupling

## What to do

Click **Sim** and listen to the earphone. Turn the light guide's knob to pull its end away from the receiver.

## What you should see

- The earphone plays the 555's tone, about 680 Hz.
- With the fibre end further away the tone gets much quieter, but its pitch stays the same.

## Why it works

The LED is either on or off at the 555's rhythm, so the light in the fibre flickers at that rhythm. The phototransistor's current follows the light, and the voltage across its resistor flickers with it. The capacitor lets only the changes through to the earphone, which turns them into sound.
