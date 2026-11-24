---
level: intermediate
age: 12+
prereqs: [lab-counter-timer, sense-light-barrier]
teaches: [light-barrier, counting, decoding, relay]
---
## What you see
An infrared light barrier, a counter with three LEDs and a relay with a green lamp. The light path's slider plays the object that walks through the beam.

## Try this
1. Click **Sim**. Push the light path's `blocked` slider to 1 and back to 0: the counter shows 1.
2. Do it five more times. At 6 the relay clicks in and the green lamp lights.
3. Keep interrupting: the count stays at 6.
4. Press the reset button: counter and relay start over.
5. Push the slider only halfway: that does not count.

## What is going on
The phototransistor passes current while it sees the infrared beam; blocking the beam drops its output, and that drop is a clock pulse for the counter. Two diodes watch two counter outputs: only when both are high (binary 110, which is 6) can their junction rise and switch on the transistor that drives the relay. One set of relay contacts lights the lamp; the other disconnects the counter's clock, so nothing more is counted until you reset. Such counters count visitors at a door or parts on a conveyor belt and stop the belt when a box is full.

## Go further
- [lab-ir-remote-toggle](../lab-ir-remote-toggle) — infrared flashes toggle a relay.
- [lab-counter-timer](../lab-counter-timer) — a counter that stops its own clock.
