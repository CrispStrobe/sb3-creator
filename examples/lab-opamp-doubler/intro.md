# Frequency doubler from four op-amps

One op-amp blinks a green LED. Three more op-amps watch its capacitor's ramp pass through a window — twice per blink — and blink a red LED twice as fast.

**Teaches:** window comparator, NAND from comparators, frequency doubling

## What to do

Click **Sim** and compare the green LED (led_17) with the red one (led_19). Then turn WIDTH (potentiometer_10) slowly up.

## What you should see

- Red blinks twice for every green blink.
- With WIDTH turned up the window closes and the red LED stays on.

## Why it works

The ramp climbs through the window and, half a period later, falls back through it. Two comparators say "above the bottom" and "below the top"; only when both are true is the ramp inside, and the fourth op-amp then pulls the red LED's line low. Two passes per period make twice the frequency.
