---
level: intermediate
age: 10+
prereqs: [01-blink, 11-toggle-button]
teaches: [pir, digital-sensor, hold-time]
---
## What you see
A passive infrared (PIR) motion sensor watches the room. When someone moves, a lamp LED switches on and the buzzer chirps twice. The lamp stays on for five seconds after the last movement, and every new movement starts those five seconds again — exactly how a hallway light with a motion sensor behaves.

## Try this
1. Run the program and switch the PIR's motion on: the lamp lights and the buzzer chirps.
2. Switch motion off and count: the lamp goes out about five seconds later.
3. Switch motion on and off several times quickly. The lamp stays on, but the buzzer chirps only once — find the line that makes that happen.

## What is going on
A PIR module has its own small circuit that turns a change in infrared light into a clean digital signal: LOW when nothing moves, HIGH while something does. Because the module drives the line itself, the MCU pin needs no pull-up resistor — unlike a push button, which only connects or disconnects.

The program does not use a five-second wait. A wait would freeze the program, and it could not notice new movement in the meantime. Instead a counter is set to 50 on every detection and counted down by one every 100 ms; the lamp is on while the counter is above zero.

## Why it matters
"Keep something on for a while after the last event" is everywhere: stair lights, screen timeouts, the hand dryer that keeps blowing a moment after you pull your hands away. A countdown that each new event resets is the standard way to build it without blocking the rest of the program.

## Go further
- [sense-clap-switch](../sense-clap-switch) — another module that drives its output, this time reacting to sound.
- [sense-twilight-switch](../sense-twilight-switch) — add a light sensor so the lamp only reacts after dark.
- Experiment: make the hold time adjustable — a longer hold for every extra detection, up to a maximum.
