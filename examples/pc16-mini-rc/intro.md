---
level: intermediate
age: 12+
prereqs: [pc14-mini-led, pc06-rc-charge]
teaches: [rc-time-constant, capacitor-charging, exponential-curve]
---

## What you see

A mini breadboard with just two parts: a 10 kΩ resistor and a 100 µF
capacitor, meeting in column 7. Nothing lights up. If you run this for one
millisecond and look away, you will conclude it is broken — and you will be
wrong, because this circuit takes **seconds**.

## Try this

1. Click **Sim** and watch the voltage where the resistor meets the capacitor
   (column 7). It climbs, slowly.
2. Read it at **1 second**: about **3.16 V**. That is 63 % of 5 V.
3. Read it at **2 seconds**: **4.32 V** (86 %). At **3 seconds**: **4.75 V**
   (95 %). At **5 seconds**: **4.97 V** (99 %).
4. Notice the pattern in the *gaps*, not the numbers. From 0 to 1 s it gained
   3.16 V. From 1 to 2 s only 1.16 V. From 2 to 3 s only 0.43 V. Each second it
   covers about 63 % of whatever distance is left.
5. Change the resistor to 1 kΩ. Every one of those times divides by ten: 63 %
   now arrives at 0.1 s.

## What is going on

A capacitor is a bucket for charge, and a resistor is a narrow pipe. The supply
is trying to fill the bucket through the pipe.

At the start the bucket is empty, so the full 5 V is pushing across the
resistor and charge flows in fast. But as the bucket fills, its own voltage
pushes back. When the capacitor is at 3 V, only 2 V is left across the resistor
to drive the flow, so the filling slows down. When it is at 4.5 V, only 0.5 V
remains, and it crawls. The fuller it gets, the slower it fills — which means
it never quite finishes.

The number that describes this is the **time constant**, written τ (tau), and
it is simply resistance × capacitance:

**τ = 10 000 Ω × 0.0001 F = 1 second**

One τ always gets you 63 % of the way to the target. Two τ gets you 86 %, three
τ 95 %, five τ 99 %. Those percentages are the same for every RC circuit that
has ever existed — only the length of a τ changes. That is why engineers quote
τ instead of quoting a voltage-versus-time table: one number tells you the
whole curve.

Multiply R by ten, or C by ten, and τ multiplies by ten. That is the entire
design rule.

## Why it matters

τ is how you buy time in a circuit without a clock or a program: debouncing a
button, holding a reset pin low while a chip powers up, smoothing a flickering
supply, setting how fast a lamp fades. Every one of those is somebody choosing
an R and a C to make τ come out right.

## Go further

- **Next:** [pc21-rc-smoothing](../pc21-rc-smoothing) — the same physics with
  τ = 100 ms, fast enough to watch in one screen.
- **Then:** [pc50-two-stage-rc](../pc50-two-stage-rc) — two of these in a row.
- **Experiment:** predict the voltage at 4 seconds before you measure it. You
  have 4.75 V at 3 s and 0.25 V of distance left; one more τ covers 63 % of
  that, so 4.75 + 0.16 ≈ **4.91 V**. Check it.
