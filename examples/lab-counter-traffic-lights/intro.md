# Traffic light from a counter

Red, red and amber, green, amber, red again – the sequence of a traffic light, made from a clock, a binary counter and four transistors.

**Teaches:** binary counting, decoding with transistors, logic with discrete parts

## What to do

Click **Sim** and watch the three LEDs. The clock steps about twice a second.

## What you should see

- Red → red + amber → green → amber → red, one step about every half second.

## Why it works

The counter's two lowest outputs count 00, 01, 10, 11 over and over. The transistors turn that into the lights: red is on while the second output is low, amber follows the first output, and green is on when the second output is high and the first is low – a fourth transistor blocks it otherwise.
