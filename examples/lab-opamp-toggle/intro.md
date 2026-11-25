# Op-amp flip-flops: set, reset and toggle

Two latches made from op-amps. The first has a SET and a RESET button. The second has only one button, and each press switches it to the other state.

**Teaches:** latch, positive feedback, toggle flip-flop

## What to do

Click **Sim**. Press SET (button_9), then RESET (button_11), and watch the yellow LED (led_14). Then press TOGGLE (button_18) a few times, leaving about a second between presses, and watch the red LED (led_22).

## What you should see

- SET: yellow on; RESET: yellow off. It stays as you left it.
- TOGGLE: red on, off, on, off, one change per press, even if you hold the button down.

## Why it works

Each op-amp feeds part of its output back to its + input, so whichever way it is switched, it keeps itself there. The toggle's capacitor charges slowly from the output and so still holds the old state when you press; the button lets that old level reach the op-amp's other input and pushes it the opposite way.
