---
level: intermediate
age: 12+
prereqs: [pc67-555-tongenerator]
teaches: [555-timer, alarm, button-activated, buzzer]
---
## What you see
An alarm sounder: the button connects power to the 555 timer, the buzzer sounds immediately. Release → silence.

## Try this
1. Click **Sim** — no sound (timer unpowered).
2. Press the button — the buzzer produces an alarm tone (~686 Hz).
3. Release — instant silence.

## What is going on
The button is in the 555's supply line. Pressing it connects VCC to the timer, which immediately oscillates in astable mode and drives the buzzer. R₁ = 1 kΩ, R₂ = 10 kΩ, C = 100 nF → f ≈ 686 Hz.

## Go further
- [pc76-alarmschaltung](../pc76-alarmschaltung) — alarm with memory (latch holds the tone).
- [pc67-555-tongenerator](../pc67-555-tongenerator) — same tone generator without the button.
