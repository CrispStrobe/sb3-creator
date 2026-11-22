---
level: intermediate
age: 12+
prereqs: [pc54-opamp-follower, lab-power-matching]
teaches: [voltage-follower, input-impedance, loading, buffer]
---
## What you see
Two potato cells, each worth 0.9 V but with a lot of resistance inside. Potato A drives a 4.7 kΩ load directly. Potato B drives the same load through an op-amp wired as a follower.

## Try this
1. Read both voltmeters. Potato A shows less than half a volt, potato B shows the full 0.9 V.
2. Work out potato A's reading as a voltage divider: 5 kΩ inside, 4.7 kΩ outside.
3. Check the current coming out of potato B. It is practically zero: the load current comes from the op-amp's battery.

## What is going on
Every measurement takes some current from what it measures. A potato, a sensor or a crystal can only give a tiny current, so a low-resistance load pulls its voltage down. The follower is an op-amp whose output is fed straight back to its inverting input: it drives its output until both inputs are equal, so the output copies the input with gain 1. Its input takes almost no current, and its output can deliver milliamps from its own supply. That is why buffers sit between weak sources and real loads.

## Go further
- [lab-opamp-gain](../lab-opamp-gain): feedback with a gain other than 1.
- [lab-power-matching](../lab-power-matching): the same divider effect, measured as power.
