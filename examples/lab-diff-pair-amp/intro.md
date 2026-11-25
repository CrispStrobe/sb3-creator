# Differential pair and amplifier chip: comparator and blinker

A transistor pair in front of the amplifier chip turns it into a comparator that notices a few hundredths of a volt. Feed its own output back through a capacitor and it blinks — which is exactly how the amplifier-chip blinker works inside.

**Teaches:** differential pair, comparator, hysteresis, relaxation oscillator

## What to do

Click **Sim**. Turn the **pot** slowly through the middle (0.49 … 0.51). Then move the **slide switch** to the right and wait two seconds.

## What you should see

- Left: the LEDs swap at a tiny turn of the pot, and swap back a little lower down.
- Right: after a short wait, red and green blink about four times a second.

## Why it works

The pair's collectors move in opposite directions when its bases differ, and the amplifier multiplies that difference. On the right the output charges the capacitor on the input side until the comparison turns round, the output flips and discharges it again.
