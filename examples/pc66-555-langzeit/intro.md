---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable]
teaches: [555-timer, monostable, long-duration, RC-timing]
---
## What you see
A 555 long-duration timer: pressing the button lights the LED, which stays on for t = 1.1 × R × C — here R = 1 MΩ, C = 100 µF → t ≈ 110 s (nearly two minutes).

## Try this
1. Press the button — the LED lights up.
2. Wait — the LED stays on for almost two minutes, then turns off by itself.
3. Another press restarts the timer.

## What is going on
The large resistor and large capacitor produce a long time constant. The capacitor takes 110 seconds to reach 2/3 VCC. Only then does the internal comparator flip and the output go LOW. The formula t = 1.1 × R × C works identically to a short one-shot — only the component values are larger.

## Go further
- [pc47-555-monostable](../pc47-555-monostable) — short pulse with small RC values.
- [pc64-555-retrigger](../pc64-555-retrigger) — retriggerable one-shot.
