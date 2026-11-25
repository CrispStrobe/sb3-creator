# Red or green? The LM386 as a colour comparator

A red LED shines on a surface and a phototransistor catches what comes back. An LM386 amplifier chip, used here as a comparator, decides between red and green and lights the matching LED.

**Teaches:** reflection and colour, the comparator, using an audio amplifier chip as a switch

## What to do

Click **Sim**: the surface is red. In the inspector, set the light path's `surface` to green, then white, then black. Set it back to red and move the light path's slider to pull the surface further away.

## What you should see

- Red or white surface: the red LED lights.
- Green or black surface: the green LED lights.
- Red surface more than about 2 cm away: the green LED lights, because too little light comes back.

## Why it works

A red surface reflects red light well; a green one swallows most of it. The phototransistor turns the reflected light into a voltage. The LM386 compares it with the voltage from the pot: with its two gain pins joined it amplifies the difference 200 times, so its output jumps to high or low. High lights the red LED, low lets current flow from the supply into the output and lights the green one.
