# A two-bit counter clocked by an op-amp

Two LEDs count from 0 to 3 in binary and start again. An op-amp provides the clock pulses; two transistor flip-flops do the counting.

**Teaches:** toggle flip-flop, frequency divider, binary counting, carry

## What to do

Click **Sim**. Press **RESET**, release it, and watch the two LEDs (bit 1 is the left digit of the number, bit 0 the right one).

## What you should see

- RESET: both off (00).
- Then 01, 10, 11, 00 … about seven steps a second.

## Why it works

A flip-flop of two transistors keeps one of two states. Small capacitors and diodes steer each falling clock edge onto the transistor that is currently on and switch it off, so the pair changes state at every edge. The second flip-flop listens to the first one and changes each time the first returns to 0, like the carry when you add 1 to 01.
