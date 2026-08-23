---
level: beginner
age: 10+
prereqs: []
teaches: [microbit, accelerometer, variables, edge-detection]
---

# Step Counter

Turn your micro:bit into a simple pedometer!

## What you see

Attach the micro:bit to your belt or hold it in your hand. Every time you
take a step, an upward-arrow icon flashes briefly on the display. The
program counts each step internally in the `steps` variable.

## Try this

1. Flash the program to your micro:bit.
2. Hold the micro:bit upright and walk around.
3. Watch the arrow flash with each step.
4. Try running — the arrow should flash faster.

## What is going on

The accelerometer measures acceleration along three axes. When you walk,
your body bobs up and down, producing spikes on the Z-axis. The program
checks whether the Z reading exceeds 1500 (roughly 1.5 g). A latch
variable `was_high` ensures each spike is counted only once — it flips
to 1 on the rising edge and back to 0 when the reading drops.

## Why it matters

Edge detection is fundamental to embedded sensing. Without the latch, a
single hard step that keeps the reading above 1500 for several loop cycles
would be counted many times. The pattern — "detect a threshold crossing,
act once, wait for it to reset" — appears in button debouncing, zero-
crossing detectors, and motion-triggered alarms.

## Go further

- Adjust the threshold (1500) for different activities — running vs walking.
- Count steps on the X-axis instead for sideways motion.
- Add a display that shows the step count when button A is pressed.
