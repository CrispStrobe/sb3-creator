---
level: beginner
age: 8+
prereqs: [pc01-led-resistor, pc08-diode-polarity]
teaches: [diode-forward-drop, series-circuit, voltage-budget]
---

## What you see

One loop: the 5 V supply, a 220 ohm resistor, a plain diode, and a green LED.
The LED is lit, but not as brightly as it would be on its own. There is no chip
and no program here — power in, light out.

## Try this

1. Click **Sim**. The green LED lights up.
2. Read the voltage at the three points down the loop. You should see **5 V**
   at the top of the resistor, about **2.9 V** just below it, and about
   **2.1 V** between the diode and the LED.
3. Subtract: the resistor took 5 − 2.9 = **2.1 V**, the diode took
   2.9 − 2.1 = **0.8 V**, and the LED took the last **2.1 V**. Add them back
   up and you get 5 V exactly.
4. Open `circuit.json` and change the diode's `vf` from `0.7` to `0.3` — that
   is roughly a Schottky diode. Run it again: the LED gets a little brighter,
   because the diode is keeping less for itself.
5. Put `vf` back to `0.7`.

## What is going on

Think of the 5 V as pocket money that has to be spent completely by the time
the current gets back home. Every part in the loop takes its cut.

The LED and the diode are both fussy about their cut: they take roughly the
same amount no matter what, about **2.1 V** for this green LED and about
**0.8 V** for the diode. They are not negotiating.

The resistor is the opposite. It takes whatever is left over — here 2.1 V — and
that leftover is what decides the current. 2.1 volts across 220 ohms gives
2.1 ÷ 220 = **0.0096 amps**, or about **9.6 milliamps**. That current flows
through everything in the loop, because in a single loop there is nowhere else
for it to go.

Here is the part worth remembering. People say "a diode drops 0.7 volts", and
this one is dropping 0.8. Nobody made a mistake. A diode's drop creeps up as
you push more current through it, and 0.7 V is the number measured at a much
gentler current than we are using. So the neat sum (5 − 0.7 − 2.0) ÷ 220 =
10.5 mA comes out about 10 % too big. Close enough to design with, not close
enough to call exact.

## Why it matters

Stacking parts in one loop means stacking their voltage cuts, and you can run
out of volts. Two LEDs plus this diode would need 2.1 + 2.1 + 0.8 = 5 V before
the resistor gets anything at all — the circuit would barely glow. Knowing each
part's cut is how you find out in advance whether an idea will work.

## Go further

- **Next:** [pc17-current-compare](../pc17-current-compare) — same idea, but
  three loops side by side with different resistors.
- **Then:** [pc18-zener-clamp](../pc18-zener-clamp) — a special diode that
  takes a big, exact cut on purpose.
- **Experiment:** put a *second* plain diode in the loop, in the same
  direction. Predict the new LED voltage before you run it. (Hint: another
  0.8 V has to come from somewhere, and only the resistor is flexible.)
