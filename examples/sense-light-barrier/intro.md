---
level: intermediate
age: 12+
prereqs: [03-night-light]
teaches: [ldr, calibration, averaging, counting]
---
## What you see
An LED shines across a gap onto a light sensor (LDR). Whenever something passes through the beam, the hit LED lights and a counter goes up — like the light barrier at a shop door or on a conveyor belt. The clever part: the program measures the light at start and sets its own trigger level, so it works in a bright room and a dim one without changing the code.

## Try this
1. Set the LDR's light level high and start the program. Read the trigger level it prints.
2. Lower the light level below that value: hit lights and the count goes up by one. Raise it again, then lower it again: the count goes up once more.
3. Restart with a much lower light level. The printed trigger level changes, and the barrier still works.

## What is going on
The LDR sits at the top of a voltage divider, so more light means a higher reading. At start the program takes eight readings and averages them, which smooths out noise. Its trigger is 70 % of that average: clearly below normal, but not so low that a slightly dimmer moment triggers it.

A variable called `blocked` remembers whether the beam is currently interrupted. The count only goes up on the change from clear to blocked, so an object that stays in the beam counts once.

## Why it matters
Real sensors drift with temperature, ageing and surroundings. Measuring a baseline and working relative to it — instead of a fixed number typed into the code — is how robust sensing is done, from automatic doors to smoke detectors.

## Go further
- [sense-twilight-switch](../sense-twilight-switch) — fixed thresholds with hysteresis instead of calibration.
- [sense-noise-counter](../sense-noise-counter) — the same counting idea with sound.
- Experiment: measure how long the beam stayed broken and print it — the start of a speed trap.
