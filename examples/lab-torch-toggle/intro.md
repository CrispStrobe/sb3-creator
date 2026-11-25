# Flip-flop toggled by a torch

**Teaches:** flip-flop, edge triggering, phototransistor

## What to do

Click **Sim**: the green LED is lit. Move the phototransistor's light slider (phototransistor_11) up, like shining a torch on it, then back to dark. Repeat.

## What you should see

- Each flash of light swaps the LEDs: green, red, green …
- The state stays when the light is gone.

## Why it works

Light switches on the small transistor next to the phototransistor and pulls the trigger line down. That sudden drop goes through two small capacitors to both halves of the flip-flop, but a diode lets it through only to the half that is conducting. That half switches off, the other one takes over, and the cross-wiring holds it there until the next flash.
