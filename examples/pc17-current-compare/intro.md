---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor, pc04-parallel-leds]
teaches: [ohms-law, current-limiting-resistor, parallel-circuit, brightness]
---

## What you see

Three LEDs in a row — red, green, blue — all fed from the same 5 V supply, each
through its own resistor. The resistors are different: 220, 470 and 1000 ohms.
The LEDs are noticeably different brightnesses, and the pattern is the one you
would not guess: **the biggest resistor makes the dimmest light.**

## Try this

1. Click **Sim**. All three light, at three clearly different levels.
2. Read the current in each branch. You should get about **13 mA** (red),
   **6.3 mA** (green) and **3.0 mA** (blue).
3. Look at the resistor values next to them: 220, 470, 1000. Roughly doubling,
   then roughly doubling again. Now look at the currents: 13, 6.3, 3.0 —
   roughly halving, then halving again.
4. Read the voltage at each LED's anode. All three are close to **2 V**: 2.13,
   2.06, 2.03. Almost the same, but not quite — and the brightest one is the
   highest.
5. Change the 1000 Ω to 2200 Ω. The blue LED dims. Check the red and green:
   unchanged, to the last decimal.

## What is going on

The LED sets the voltage; the resistor sets the current.

Every branch starts with the same 5 V. Each LED insists on taking about 2 V,
so each resistor is left with about 3 V across it — the same 3 V in all three
branches. What differs is what that 3 V can push through:

- 3 V ÷ 220 Ω = 13.6 mA
- 3 V ÷ 470 Ω = 6.4 mA
- 3 V ÷ 1000 Ω = 3.0 mA

That is Ohm's law doing the entire job, and it explains why bigger resistor
means dimmer LED: the resistor is the narrow part of the pipe, and a narrower
pipe passes less.

Step 4 is the detail worth catching. The three LEDs are *not* at exactly 2 V —
they sit at 2.13, 2.06 and 2.03, and the one carrying the most current sits
highest. An LED's forward voltage creeps up as you push more through it. That
is why the measured currents (13.04, 6.25, 2.97 mA) come out a few percent
below the neat calculation above: the resistor got slightly less than 3 V in
the busiest branch. The estimate is fine for choosing a resistor; it is not
exact, and knowing which direction it errs in is part of reading a circuit.

Step 5 is the parallel rule again: three separate roads, no sharing.

## Why it matters

"What resistor do I need?" is the most-asked question in beginner electronics,
and this is the whole answer: decide the current you want, subtract the LED's
voltage from the supply, and divide. 20 mA is a typical LED maximum, so a
220 Ω on 5 V is near the bright end and perfectly safe; going much below that
is how LEDs get destroyed.

## Go further

- **Next:** [pc20-rgb-mix](../pc20-rgb-mix) — the same three branches, chosen
  to mix into a colour rather than to compare.
- **Then:** [pc45-led-current-comparison](../45-led-current-comparison) — the
  comparison taken further.
- **Experiment:** pick a target of 10 mA for the blue LED and work out the
  resistor before you type it. (3 V ÷ 0.010 A = 300 Ω, so use 330 Ω, the
  nearest standard value — then measure and see whether you got 9 mA instead
  of 10, and why.)
