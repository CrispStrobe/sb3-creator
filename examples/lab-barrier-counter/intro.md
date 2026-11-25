---
level: advanced
age: 14+
prereqs: [lab-counter-timer, lab-ir-beam-alarm]
teaches: [light-barrier, pulsed-light, counting, decoding, relay]
---
## What you see
A 555 flashes an infrared LED a thousand times a second. On the other side a receiver listens for those flashes, a counter with three LEDs counts every interruption, and after five a relay clicks in and a green lamp lights.

## Try this
1. Click **Sim** and wait a moment. Push the light path's `blocked` slider to 1 and back: the counter shows 1.
2. Do it four more times. At 5 the relay pulls in and the lamp lights.
3. Keep interrupting: the count stays at 5.
4. Press reset: everything starts over.

## What is going on
The receiver does not just measure brightness: a capacitor and two diodes only pass changing light, so only the transmitter's flashes charge up the signal that holds the first transistor on. A dim lamp on the phototransistor gives steady light and does nothing; bright light would blind it. When something breaks the beam, the flashes stop, the second transistor's output falls, and the counter steps on. Two diodes watch two counter outputs; only at 101 in binary (five) are both high, and the relay pulls in. One of its contacts lights the lamp, the other disconnects the counter's clock, so it holds at five until you reset it.

## Go further
- [lab-ir-beam-alarm](../lab-ir-beam-alarm) — a steady beam that sounds an alarm when broken.
- [lab-counter-timer](../lab-counter-timer) — a counter that stops its own clock.
