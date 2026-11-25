# Touch plates set and reset an op-amp latch

Touch one plate and a red light comes on and stays on; touch the other and it goes off. An op-amp that feeds its own output back to its + input remembers which plate was touched last.

**Teaches:** comparator, positive feedback, bistable memory, high input resistance

## What to do

Click **Sim**. Press and release **SET** (a finger bridging the first pair of plates), then **RESET**.

## What you should see

- At the start the green LED is lit.
- After SET the red LED is lit, and it stays lit when you let go.
- After RESET the green one is lit again.

## Why it works

The − input sits at a fixed 3 V. The + input is tied to the op-amp's own output through 10 MΩ: a high output keeps + above 3 V, a low output keeps it below, so either state holds itself. Your finger (about 1 MΩ) is still enough to pull + across the threshold, because almost no current flows into an op-amp input.
