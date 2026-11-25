# One-touch on/off switch

One touch switches it on, the next touch switches it off. Keep your finger on and it blinks.

**Teaches:** flip-flop, a capacitor as a memory, 555 comparators

## What to do

Click **Sim**. Tap TOUCH (button_9) briefly: the red LED and the relay (relay_13) switch on. Tap again: off. Then hold TOUCH for a few seconds.

## What you should see

- Each short tap switches the LED and relay the other way.
- Held down: the LED blinks, on for about half a second, off for about a tenth.

## Why it works

The 555's input sits halfway between its two switching voltages, so it stays as it is. A capacitor is charged from the output: full when the output is on, empty when it is off. Your finger connects the capacitor to the input. A full capacitor lifts the input above the upper switching voltage and the output goes off; an empty one pulls it below the lower switching voltage and the output goes on. Leave your finger on and the capacitor charges or empties to the new state and flips it again.
