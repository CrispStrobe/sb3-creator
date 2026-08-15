---
level: intermediate
age: 12+
prereqs: [pc13-direct-diode, pc02-voltage-divider]
teaches: [zener-diode, voltage-regulation, reverse-breakdown, load-line]
---

## What you see

A 9 V supply — higher than everything else in this gallery — feeding a 330 Ω
resistor. Below the resistor sits a zener diode, and it is fitted **backwards**
compared with every other diode you have met: its striped end points at the
positive side. From that junction, a 1 kΩ resistor and a green LED run to
ground. The LED is lit and the junction reads about 5.1 V, not 9 V.

## Try this

1. Click **Sim** and read the junction between the 330 Ω resistor and the
   zener. About **5.14 V**.
2. Open `circuit.json` and change the source from 9 V to **12 V**. Run again
   and read the same point: **5.19 V**. The input went up by 3 V; the junction
   went up by 0.05 V.
3. Now try **6 V**. The junction reads **5.01 V** — still about 5.1.
4. Put it back to 9 V.
5. For contrast, delete the zener entirely and run it. The junction now
   follows the input all the way up, and at 12 V the LED is being driven far
   harder than it was designed for.

## What is going on

An ordinary diode blocks when you connect it backwards. A zener blocks too —
right up to a particular voltage, and then it gives way. This one gives way at
about 5.1 V, and that number is what you buy it for.

Once it has given way, it behaves like a very stubborn wall. Push harder from
the input and the zener simply takes more current while holding its voltage
almost still. The extra push has to be absorbed somewhere, and that somewhere
is the **330 Ω resistor** above it. At a 9 V input the resistor has 3.86 V
across it and passes 11.7 mA: 3.1 mA goes to the LED branch, the other 8.6 mA
the zener swallows and turns into heat.

That is the trade. A zener regulator wastes current on purpose so that the
voltage stays put. Change the input from 6 V to 12 V — a swing of 6 V — and the
output moves by 0.17 V. That is a rejection of about 35 to 1.

Compare it with a plain resistive divider, which is the other way people try to
make a smaller voltage. A divider is a *ratio*, so its output tracks the input
in proportion: the same 6 → 12 V sweep would have taken its output from 4 V to
8 V and doubled the LED's current. A divider makes a fraction. A zener makes a
**value**.

The imperfection is visible too. The junction is not fixed at exactly 5.1 V —
it creeps from 5.01 to 5.19 V across the sweep, because the zener's breakdown
is steep but not vertical. Real regulators are always a little bit divider.

## Why it matters

The 5 V that microcontrollers, sensors and logic chips all expect has to come
from somewhere, and batteries do not supply it: a 9 V block starts nearer 9.5 V
and sags towards 7 V as it dies. Something has to turn a drifting input into a
steady rail. A zener is the simplest thing that does, and understanding it is
the step before three-pin regulators like the 7805 stop looking like magic.

## Go further

- **Next:** [pc41-zener-reference](../pc41-zener-reference) — the zener used as
  a measuring reference rather than a supply.
- **Then:** [23-voltage-regulator](../23-voltage-regulator) — the same job done
  by a proper regulator chip, and what it buys you.
- **Also:** [pc49-diode-clamp](../pc49-diode-clamp) — clamping a signal instead
  of a supply.
- **Experiment:** work out what happens if the LED branch suddenly needs 20 mA
  instead of 3 mA. The 330 Ω resistor can only deliver about 11.7 mA in total,
  so the zener would run dry, stop conducting, and the regulation would
  collapse. Try it by changing the 1 kΩ to 100 Ω and see where the junction
  lands.
