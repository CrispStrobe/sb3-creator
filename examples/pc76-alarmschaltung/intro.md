---
level: advanced
age: 14+
prereqs: [pc59-nor-memory, pc75-alarmgeber]
teaches: [NOR-latch, alarm, contact-switch, memory, buzzer]
---
## What you see
An alarm circuit with memory: a contact switch (reed/tilt) triggers the alarm, a NOR latch remembers the state, the buzzer sounds continuously. Only the reset button silences it.

## Try this
1. Click **Sim** — no sound (latch in idle state).
2. Activate the alarm switch — the buzzer sounds and stays on.
3. Press the reset button — the buzzer goes silent.
4. The alarm switch can be released, but the sound persists until reset.

## What is going on
Two NOR gates are cross-coupled as an SR latch. The alarm switch sets the latch (Q = HIGH → buzzer on). The latch remembers the state: even after the switch releases, the buzzer stays active. Only a HIGH pulse on the reset input (second NOR gate) flips the latch back (Q = LOW → buzzer off).

## Go further
- [pc59-nor-memory](../pc59-nor-memory) — the NOR latch in isolation.
- [pc75-alarmgeber](../pc75-alarmgeber) — alarm without memory (sound only while button is held).
