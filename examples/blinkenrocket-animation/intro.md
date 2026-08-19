# Blinkenrocket animation

Step through animation frames on a dot-matrix display — inspired by the
Blinkenrocket badge. Two buttons (prev / next) select the frame; the
program writes a 32-bit bitmask to the matrix widget each tick.

The matrix is 4 rows × 8 columns (32 dots), the maximum that fits the
controller-panel bitmask contract (`rows × cols ≤ 32`). The real
Blinkenrocket badge uses 8×18 — wider animations need a buffer-based
display widget (future work).

## Try this
1. Click **Run on Simulator** to start.
2. Press **next** to step through frames: arrow, heart, diamond, smile,
   checker, ring, all-on, all-off.
3. Press **prev** to go back.
4. Edit the frame bitmasks in the program to draw your own patterns.

## What is going on
Each frame is a 32-bit number — bit `row × 8 + col` lights that dot. The
program stores 8 frames in variables `f0`–`f7`. The prev/next buttons
write their Scratch variables; the program increments/decrements a frame
counter modulo 8 and writes the corresponding bitmask to `screen`, which
the matrix display widget reads live.
