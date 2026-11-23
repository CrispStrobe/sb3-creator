---
level: advanced
age: 14+
prereqs: [pc70-schmitt-trigger, lab-diff-pair]
teaches: [schmitt-trigger, hysteresis, emitter-coupled, latch, clap-switch]
---
## What you see
Two transistors sharing one emitter resistor, a yellow LED, a sensitivity knob and two buttons: **clap** (it stands in for a sound pulse from a microphone) and **reset**.

## Try this
1. Click **Sim**: the LED is dark.
2. Press **clap**: the LED comes on and stays on after you let go.
3. Press **reset**: dark again.
4. Turn the sensitivity knob up towards 0.4 and clap again. The light no longer sticks.

## What is going on
The two transistors share their emitter resistor, so whichever one is conducting lifts the emitter voltage — and that sets the point at which the other one may take over. When q1 conducts the emitter is lower than when q2 conducts. The knob places q1's base between these two thresholds. A clap pulse briefly pulls q1 below the lower one, q2 takes the current and raises the emitter; when the pulse is over, q1's base is back where it was, but now that is too low to win against the raised emitter. The trigger remembers the clap. Reset pushes q1 above the upper threshold the other way.

## Go further
- [pc70-schmitt-trigger](../pc70-schmitt-trigger) — the same idea with a logic gate.
- [lab-diff-pair](../lab-diff-pair) — the shared emitter resistor without feedback.
