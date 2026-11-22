---
level: intermediate
age: 12+
prereqs: [51-555-astable, pc100-555-clock]
teaches: [binary-counting, frequency-divider, ripple-counter, timer]
---
## What you see
A 555 clock, a 4-bit binary counter chip, three red LEDs that show the count and a green "done" LED. When the count reaches eight, the counter stops its own clock.

## Try this
1. Click **Sim** and watch the red LEDs count in binary: 1, 10, 11, 100 …
2. At eight, the red LEDs go out, the green one lights and everything stops.
3. Press **start** to run the timer again.
4. Move the wire to the stop transistor from QD to QC. Now the timer stops at four.

## What is going on
Each stage of the counter flips when the stage before it falls from 1 to 0, so it changes half as often. That makes every output a divide-by-two of the previous one: four stages divide the clock by sixteen. Here the highest output is also used as an alarm: it switches a transistor that holds the 555 in reset. A slow clock and a long chain of stages give very long, very exact delays from small parts — that is how kitchen timers and the minute counters in clocks work.

## Go further
- [pc100-555-clock](../pc100-555-clock) — the clock on its own.
- [lab-coin-toss](../lab-coin-toss) — a single divide-by-two stage stopped by hand.
