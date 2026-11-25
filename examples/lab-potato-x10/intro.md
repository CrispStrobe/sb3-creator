---
level: beginner
age: 10+
prereqs: [lab-opamp-gain]
teaches: [non-inverting-amplifier, gain, input-resistance, internal-resistance]
---
## What you see
A potato with a copper coin and an iron nail in it, an op-amp and a meter. The slide switch decides what the meter shows.

## What to do
1. Click **Sim**. The meter reads about 5 V: the amplified potato.
2. Slide the switch to the left. Now the meter sits straight on the potato and hardly moves: about 0.48 V.
3. Slide it back. Ten times the voltage, and a needle you can read.

## What is going on
A potato battery gives only about half a volt, and it has thousands of ohms inside, so any meter that draws current pulls it down. The op-amp's + input draws no current at all. Two resistors in its feedback decide how many times bigger the output is: 1 + 91 kΩ / 10 kΩ, a little over 10.

## Go further
- [lab-opamp-gain](../lab-opamp-gain) — gain stages with an op-amp.
- [lab-opamp-follower](../lab-opamp-follower) — the same input with a gain of exactly one.
