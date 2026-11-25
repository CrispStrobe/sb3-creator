# Flame switch that holds itself on

A phototransistor and a transistor make a light amplifier. A flame in front of it switches an amplifier on, and the amplifier then shines its own infrared light back at the phototransistor — so the circuit stays on when the flame has gone, until a hand blocks the beam.

**Teaches:** Darlington pair, light amplifier, optical feedback, latching

## What to do

Click **Sim**. Move the phototransistor's light slider (phototransistor_3) a tiny way up, to a glimmer, and watch the yellow LED. Then move it further — the flame — and back to dark. Finally turn the light path's knob (light_path_13), the hand in the beam, up and back down.

## What you should see

- A glimmer: the yellow LED already glows; more light, brighter.
- The flame: the red LED (in series with the infrared LED) comes on — and stays on when the slider is back at dark.
- Hand in the beam: everything goes out, and stays out when the hand is taken away.

## Why it works

The phototransistor's tiny current is the second transistor's base current, which it multiplies by about a hundred. When the voltage this makes exceeds the amplifier's reference, the output jumps high and lights the infrared LED. Its light falls on the phototransistor and keeps the current flowing: the circuit feeds itself. Block the light and the loop breaks.
