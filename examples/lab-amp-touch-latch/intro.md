# Amplifier chip as a memory and a monoflop

The same amplifier chip that plays music can remember a touch — or, with a capacitor instead of a resistor, light a lamp for a fixed time after you touch it.

**Teaches:** set/reset latch, monoflop, Darlington touch sensor

## What to do

Click **Sim**. Press and release the touch button (button_3, your fingertip), then the reset button (button_14). Move the **slide switch** to the right and touch again.

## What you should see

- Left: one touch switches the LED on and it stays on; RESET switches it off.
- Right: the LED stays on for about a quarter of a second and goes out by itself.

## Why it works

With the resistor, part of the high output comes back to the + input and keeps it above the 3 V on the − input: the chip holds itself. With the capacitor, the output's jump is passed back only for a moment; as the capacitor charges the + input sinks below 3 V and the output falls back.
