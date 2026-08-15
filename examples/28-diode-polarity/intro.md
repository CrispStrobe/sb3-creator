---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [diode-polarity, forward-reverse, current-direction]
---

## What you see

A diode is wired between an MCU output pin and an LED. The program alternates
between driving the pin high and low. In one direction the LED lights up; in the
other it stays dark. The diode is the gatekeeper -- it lets current through one
way and blocks it the other way.

## Try this

1. Click **Sim**. The LED blinks on for one second, then stays off for one
   second, repeating.
2. Look at the diode symbol in the schematic. The triangle points from anode
   to cathode -- current flows in the direction the triangle points.
3. In the circuit editor, swap the diode's anode and cathode connections. Run
   the simulation again. Now the LED is dark when it was lit before, and vice
   versa.

## What is going on

A diode is a one-way valve for electric current. When current tries to flow from
anode to cathode (forward bias), the diode conducts and drops about 0.7 V across
itself. When current tries to flow the other way (reverse bias), the diode
blocks and essentially no current flows. The MCU pin alternates between high and
low, so in one phase the diode is forward-biased and the LED lights, and in the
other phase the diode is reverse-biased and the LED is dark.

## Why it matters

Polarity protection, rectification, and signal routing all depend on the diode's
one-way property. Getting a diode backwards is one of the most common wiring
mistakes, and understanding forward vs. reverse bias is the first step to
understanding transistors, which are the building block of every digital circuit.

## Go further

- **Where the LED basics come from:** [01-blink](../01-blink) -- the simplest
  LED circuit.
- **A diode protecting a circuit:** [33-inductive-no-flyback](../33-inductive-no-flyback)
  -- what happens when the protective diode is missing.
- **Experiment:** add a second LED in the opposite direction (cathode toward
  the pin, anode toward ground). Now one LED lights when the pin is high and
  the other lights when the pin is low -- a visual polarity indicator.
