# Contact bounce: a counter counts one press several times

Press a button once, and the counter jumps by four. The contacts inside the button bounce for a few thousandths of a second, too fast to see, but not too fast for a counter. A second button shows how to tame it.

**Teaches:** contact bounce, binary counter, debouncing with RC and a Schmitt trigger

## What to do

Click **Sim**. Press **BOUNCY** once and release it, and read the three LEDs as a binary number. Press **RESET**. Slide **CLOCK FROM** to the clean button and press **CLEAN** a few times.

## What you should see

- BOUNCY: one press makes 4, the release makes 7.
- CLEAN: each press counts exactly one.

## Why it works

When metal contacts close they spring apart and touch again several times within a few milliseconds. Each time they open, the counter sees a falling edge and counts. The clean button charges a capacitor through a resistor instead; the short gaps of the bounce are too brief to empty it. A 555 used as a Schmitt trigger turns the slowly rising voltage into one sharp edge.
