# Focusing light into a light guide

An LED 9 cm from the end of a light guide sends almost nothing into it: its light spreads out far wider than the 1 mm core. Put a lens in between and slide the fibre end to the right place, and the meter at the far end jumps.

**Teaches:** coupling light into a fibre, the lens equation, matching a lens to the fibre's acceptance cone

## What to do

Click **Sim** and read the meter. Turn the knob slowly to move the fibre end and find the highest reading. Then clear the lens (`lensFocalCm`) in the inspector and set `inGapMm` to 90 to compare.

## What you should see

- About 4.1 V with the fibre end at 9 cm.
- Moving it a few millimetres either way: the reading falls quickly.
- Without the lens: almost nothing.

## Why it works

The lens draws a small image of the LED's glowing chip 3 cm behind it (1/f = 1/u + 1/v with f = 2 cm and u = 6 cm). Only at that point is the light squeezed into a spot about as small as the fibre's core. In front of it or behind it the light is spread over a larger spot and most of it misses the core.
