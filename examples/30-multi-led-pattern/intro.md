---
level: intermediate
age: 12+
prereqs: [12-dual-blink]
teaches: [led-patterns, bit-manipulation, animation]
---

## What you see

Several LEDs are connected to consecutive MCU pins. The program cycles through
a series of patterns -- all on, all off, alternating, chasing left, chasing
right, building up one by one -- creating a light show that repeats in a loop.

## Try this

1. Click **Sim** and watch the full pattern cycle. Count how many distinct
   patterns there are before it repeats.
2. Look at the code. Each pattern is a list of on/off states for each LED,
   written as a binary number or a list of 1s and 0s.
3. Change one pattern in the table -- for example, make the "all on" pattern
   leave the middle LED off. Run again and see your modification in the
   sequence.

## What is going on

The MCU stores each pattern as a set of bits, one bit per LED. To display a
pattern, it writes all the bits to the port at once, turning the right LEDs on
and the rest off. A delay between patterns controls the animation speed. The
program steps through a table of patterns in order, then loops back to the
start. This is the same idea as animation frames in a video: each frame is a
still image, and playing them in sequence creates the illusion of motion.

## Why it matters

Driving multiple outputs from a pattern table is how LED matrices, seven-segment
displays, and even screen pixels work. The jump from toggling one pin to
orchestrating eight at once is the jump from controlling a single thing to
controlling a system.

## Go further

- **The two-LED version:** [12-dual-blink](../12-dual-blink) -- independent
  timing on two LEDs, before pattern tables.
- **Shift-register extension:** [08-led-chaser-595](../08-led-chaser-595) --
  driving more LEDs than you have pins, using a shift register.
- **Experiment:** add a "bounce" mode where the chaser runs left to the end,
  then reverses direction and runs right, like a Cylon eye or a Knight Rider
  light bar.
