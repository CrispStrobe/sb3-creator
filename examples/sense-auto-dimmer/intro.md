---
level: intermediate
age: 12+
prereqs: [02-dimmer, 03-night-light]
teaches: [ldr, pwm, mapping, auto-ranging, rate-limiting]
---
## What you see
A lamp that fills in for missing daylight: in a dark room it shines brightly, in a bright room it dims almost to nothing, and in between it finds its own level. When the light changes suddenly — a hand over the sensor — the lamp glides to its new brightness instead of jumping.

## Try this
1. Run the program and move the LDR's light level from bright to dark. The lamp gets brighter as the room gets darker.
2. Jump the light level from one end to the other in one move. The lamp takes about a second to follow.
3. Change the step from 5 to 1 and try again. What do you notice, and when would each be better?

## What is going on
The ADC reading goes from 0 (dark) up to the brightest value the board can read — 1023 on most boards here, 4095 on the Pico and the STM32. So the program does not assume a range: it remembers the brightest reading it has seen and scales against that, a trick called auto-ranging. It then flips the reading around and turns it into a brightness of 100 down to 0 percent. Pulse-width modulation (PWM) makes the LED look dimmer by switching it on and off very fast and changing how much of each cycle it is on.

Instead of writing the target brightness directly, the program lets its current level move towards the target by at most 5 percent per step. That small rule is a rate limiter: it hides flicker and sudden jumps that would be annoying in a real lamp.

## Why it matters
Phone screens, car dashboards and street lights all adjust to ambient light, and all of them smooth the change so you do not notice it happening. Mapping one range onto another and limiting how fast the output may change are two of the most useful tools in control code.

## Go further
- [02-dimmer](../02-dimmer) — the same PWM output driven by your hand on a knob.
- [sense-twilight-switch](../sense-twilight-switch) — on/off control instead of a continuous level.
- Experiment: keep the lamp fully off above a certain brightness, so it never glows faintly in daylight.
