# Differential pair watching a charging capacitor

Two transistors sharing one emitter resistor compare two voltages. Here one of them watches a capacitor charge up, the other holds half the supply — and two LEDs between them tell you which is higher.

**Teaches:** differential pair, comparison, RC charging

## What to do

Click **Sim** and watch the LEDs for three seconds. Then press the button (it empties the capacitor) and watch again.

## What you should see

- Red first, then a moment where both are dark, then green.
- The button starts it over.

## Why it works

The transistor with the higher base takes most of the shared current, which pulls its own collector down. The LEDs between the two collectors light in the direction of the difference; when the bases are equal, so are the collectors, and no current flows through the LEDs.
