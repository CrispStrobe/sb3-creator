---
level: intermediate
age: 12+
prereqs: [lab-counter-timer]
teaches: [logic-threshold, bias, counter]
---
## What you see
An audio signal (a function generator stands in for a radio's earphone output), a capacitor, a pot and a counter with four LEDs. The LEDs count fast.

## Try this
1. Click **Sim**: the LEDs run through the binary count, 100 steps a second.
2. In the inspector, turn the generator's `amplitude` down from 0.5 to 0.1. The counter stops.
3. Back at 0.5, turn the threshold pot down to 0.35. It stops again.

## What is going on
A counter input sees "high" only above half the supply voltage. The pot sets the input's resting voltage a little below that level, and the capacitor adds the audio signal on top. Only when the signal is strong enough do its peaks reach the switching level, once per wave, and each crossing is a count. Turn the pot down and the resting voltage moves further away, so the signal has to be louder. The counter itself is the loudness detector.

## Go further
- [lab-octave-divider](../lab-octave-divider) — the counter as a frequency divider.
- [lab-counter-timer](../lab-counter-timer) — a counter that stops its own clock.
