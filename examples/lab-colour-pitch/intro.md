# Hear an LED's colour: pitch from forward voltage

A tone generator with an LED socket in its charging path. A red LED drops less voltage than a green one, and a green one less than a blue one. Whatever the LED takes away is missing from the voltage that charges the timing capacitor, so each colour gives its own pitch. With a little practice you can name the colour with your eyes closed.

**Teaches:** forward voltage depends on colour, oscillator frequency depends on the charging voltage, not only on R and C

## What to do

Click **Sim** and listen to the piezo: the red LED is in the socket. Then use the DIP switch to pick the wire link, the green LED and the blue LED, one at a time. Only one switch should be on.

## What you should see

- Wire link: highest tone, about 1.1 kHz.
- Red: lower. Green: lower still. Blue: lowest, about 320 Hz.
- The LED in the socket glows faintly while it plays.

## Why it works

The 555 charges its capacitor from one third to two thirds of the supply. With an LED in the way, the capacitor charges towards a lower voltage, so it reaches two thirds more slowly. The bigger the LED's voltage drop, the slower the charge and the lower the tone.
