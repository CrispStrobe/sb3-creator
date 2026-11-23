---
level: intermediate
age: 12+
prereqs: [pc76-alarmschaltung]
teaches: [flip-flop, normally-closed, fail-safe, latch, alarm]
---
## What you see
A thin wire loop runs across a door (here a slide switch). Two transistors form a memory, and a red LED is the alarm. At power-on the alarm is armed and quiet.

## Try this
1. Click **Sim**: dark.
2. Flip the door loop to "torn": the alarm LED lights.
3. Flip it back to "intact": the LED stays on — the circuit remembers.
4. Press **arm / reset**: quiet again.
5. Tear the loop and press **arm / reset** while it is still open. The alarm comes straight back.

## What is going on
The two transistors hold each other: when one is on, it takes the drive away from the other. The loop is part of the wire that keeps the first transistor on. Tear it, and the first one switches off, the second one switches on and lights the LED. Mending the loop does not help, because the second transistor now holds that wire near zero volts. A cut wire triggers the alarm instead of silencing it — that is what "fail-safe" means.

## Go further
- [pc76-alarmschaltung](../pc76-alarmschaltung) — the same memory idea with logic gates and a normally-open contact.
- [lab-electronic-fuse](../lab-electronic-fuse) — a latch triggered by too much current.
