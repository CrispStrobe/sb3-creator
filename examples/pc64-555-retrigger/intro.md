---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable]
teaches: [555-timer, monostable, retrigger, pulse-extension]
---
## What you see
A 555 timer as a retriggerable one-shot. Each button press starts a timed pulse; pressing again during the pulse extends it. R = 100 kΩ, C = 10 µF → t ≈ 1.1 s per trigger.

## Try this
1. Press the button once — the LED lights for ~1.1 seconds.
2. Press again while it is still lit — the timer restarts.
3. Without retriggering the LED turns off after t = 1.1 × R × C.

## What is going on
Each trigger pulse (pin 2 briefly pulled LOW) sets the 555 output HIGH and restarts the capacitor charge. If retriggered before the capacitor reaches 2/3 VCC, the charge starts over. Only when the capacitor reaches the threshold undisturbed does the comparator flip the output LOW.

## Go further
- [pc47-555-monostable](../pc47-555-monostable) — non-retriggerable one-shot.
- [pc66-555-langzeit](../pc66-555-langzeit) — long pulse from high RC values.
