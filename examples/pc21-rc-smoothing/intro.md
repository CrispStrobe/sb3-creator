---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge, pc16-mini-rc]
teaches: [rc-time-constant, smoothing, low-pass-filter, step-response]
---

## What you see

Two parts and a wire: a 1 kΩ resistor from the supply, and a 100 µF capacitor
from the node below it down to ground. Nothing lights up. The interesting thing
about this circuit is not what it looks like, it is **how fast it can change its
mind** — and the answer is 100 milliseconds.

## Try this

1. Click **Sim** and watch the node between the resistor and the capacitor.
   Read it at **100 ms**: about **3.16 V**, which is 63 % of 5 V. At **300 ms**
   it is **4.75 V** (95 %), and by **500 ms** it has effectively arrived.
2. Now make the supply change while the circuit is running. Let it settle to
   5 V, then drop the source to **2 V** at 500 ms.
3. Watch the node follow. 100 ms after the step it is at **3.09 V** — not at
   2 V. After another 100 ms, **2.40 V**. After a third, **2.15 V**. It takes
   about 300 ms to get 95 % of the way down.
4. Count the gaps again. Each 100 ms closes about 63 % of whatever distance is
   still left — going down, exactly as it did going up.
5. Change the resistor to 10 kΩ. Every one of those times becomes ten times
   longer.

## What is going on

The source jumped 3 V instantly. The node took a third of a second to follow.
That delay is not a fault — it is the entire product.

A capacitor resists *change* in voltage. To move the node, charge has to flow
in or out of it, and the resistor is the only way in or out. So the node can
never jump: it can only ramp, and the steepness of that ramp is set by
**τ = R × C = 1000 Ω × 0.0001 F = 100 ms**.

Now think about what that does to a signal that is wobbling. A slow change —
something that takes seconds — gives the node plenty of time to keep up, and it
passes through essentially untouched. A fast change — a spike lasting a
millisecond — is over before the node has moved even 1 % of the way, so it
barely shows up at all. The circuit passes the slow and blocks the fast, which
is why its other name is a **low-pass filter**.

That is what "smoothing" means. It is not averaging in the sense of arithmetic;
it is a lag, and the lag preferentially eats the fast stuff.

The cost is on the same coin. Make τ bigger and you reject more noise — but you
also make the output slower to respond to changes you *wanted*. Every filter
anyone has ever designed is that trade being made deliberately.

## Why it matters

This is the two-part circuit sitting next to almost every chip you will ever
use: the decoupling capacitor that keeps a supply rail from twitching when a
motor kicks, the filter on an analog sensor before it reaches an ADC, the
softener between a PWM output and something that wanted a real voltage. When
someone says "add a cap there", this is the circuit they mean and τ is the
number they are choosing.

## Go further

- **Next:** [pc50-two-stage-rc](../pc50-two-stage-rc) — two of these in
  series, which filters harder.
- **Then:** [50-rc-scope](../50-rc-scope) — the same curve on an instrument
  instead of in a table.
- **Also:** [pc43-bleeder-discharge](../pc43-bleeder-discharge) — the reverse
  problem: getting the charge back out.
- **Experiment:** you want a filter that settles within 1 second and you have a
  10 µF capacitor. What resistor? (Settling to 99 % takes 5 τ, so τ must be
  0.2 s; 0.2 ÷ 0.00001 = 20 000 Ω.) Try it and check the 1-second reading.
