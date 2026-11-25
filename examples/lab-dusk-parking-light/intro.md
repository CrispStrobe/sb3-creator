# Parking light that waits for real dusk

An automatic parking light must not blink on and off while dusk slowly falls. This one switches on when it is really dark and off only when it is clearly light again.

**Teaches:** light sensing, Schmitt trigger, comparator driving a lamp

## What to do

Click **Sim**. Move the phototransistor's **light** slider slowly down to 0.1 and then back up to 0.5.

## What you should see

- The white light comes on near 0.15.
- On the way back it stays on past 0.2 and goes off near 0.25.

## Why it works

The two transistors sharing an emitter resistor form a Schmitt trigger: once it has switched, the input has to go noticeably further back to switch it again. The amplifier compares the trigger's output with a fixed 3 V and drives the lamp with its full output.
