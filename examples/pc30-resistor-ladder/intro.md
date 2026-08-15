---
level: beginner
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [voltage-divider, series-circuit, kirchhoff-voltage-law, loading]
---

## What you see

Three identical resistors in a single line from 9 V down to ground. Nothing else
— no LED, no chip, nothing switched on. The interesting parts of this circuit
are the two junctions *between* the resistors.

## Try this

1. Click **Sim**.
2. Measure at the top: **9 V**. At the bottom: **0 V**. No surprises yet.
3. Measure the junction between `r1` and `r2`: exactly **6 V**.
4. Measure the junction between `r2` and `r3`: exactly **3 V**.
5. Change `r2` from 10000 to 20000 ohms and measure both junctions again. The
   steps are no longer equal — and the middle resistor now takes half the supply
   to itself.

## What is going on

The three resistors are in series, so exactly the same current goes through all
of them — it has nowhere else to go. Add them up: 30 kΩ total. Ohm's law gives
9 V ÷ 30 000 Ω = **0.3 mA**, and that one number flows through the whole chain.

Now work out what each resistor does with it. Voltage across a resistor is
current times resistance: 0.3 mA × 10 kΩ = 3 V. All three are the same, so each
takes 3 V, and the three drops add back up to the 9 V you started with. They
always will — voltage around a loop has to add to zero, which is Kirchhoff's
voltage law and the closest thing electronics has to a conservation-of-money
rule.

So the junctions are at 9 − 3 = 6 V and 6 − 3 = 3 V. That is the whole ladder:
one supply, several voltages, no active parts at all.

Step 5 shows the rule underneath. What sets each tap is not the resistor value on
its own but the **ratio** of what is below it to the total. Double the middle
resistor and it claims a bigger share, while the other two shrink to fit.

There is one catch, and it is the reason ladders are not used for everything: a
divider only holds these voltages while nothing is drawing current from the taps.
Connect something that needs real current and it pulls the tap down, because your
load is now a fourth resistor in the arrangement, in parallel with the ones below
the tap.

## Why it matters

This is the cheapest way to make a voltage you do not have. Every volume knob is
a ladder you can slide the tap along, every microcontroller reading a 9 V battery
does it through a divider first (5 V would destroy a 3.3 V input pin), and the
R-2R ladder — the same idea with two resistor values — is how many chips turn
numbers back into voltages.

## Go further

- **Compare:** [pc02-voltage-divider](../pc02-voltage-divider) — two resistors,
  the same rule, stated as a formula.
- **Next:** [pc37-selectable-reference](../pc37-selectable-reference) — switching
  between taps to pick a reference voltage.
- **Then:** [pc07-pot-dimmer](../pc07-pot-dimmer) — a divider whose tap you can
  move.
- **Experiment:** connect a 10 kΩ resistor from the 6 V tap to ground and measure
  again. It is no longer 6 V. Work out why before you look: what is the
  resistance from that tap to ground now, and what was it before?
