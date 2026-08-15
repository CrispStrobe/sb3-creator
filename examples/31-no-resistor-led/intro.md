---
level: beginner
age: 8+
prereqs: [21-resistor-led]
teaches: [overcurrent, current-limiting, component-damage]
---

## What you see

An LED is wired directly from VCC to ground with no current-limiting resistor.
The design-rule check (DRC) flags a warning: the calculated current of about
300 mA far exceeds the LED's 20 mA rating. This is the circuit you are being
shown so that you understand why every other LED example includes a resistor.

## Try this

1. Read the DRC warning before you run anything. It tells you the current and
   the rating.
2. Click **Sim**. The LED lights up, but the current reading confirms it is
   drawing far too much.
3. Now add a 220-ohm resistor in series with the LED and run the simulation
   again. The current drops to a safe value and the DRC warning disappears.

## What is going on

An LED has very low resistance once it starts conducting. Without a resistor to
limit the current, the supply pushes as much current as it can through the LED.
In a real circuit this would overheat the LED within seconds and burn it out --
or, if the supply is weak, it would sag and the LED would flicker dimly before
dying. The resistor is not optional decoration; it is the part that turns a
destructive short circuit into a safe, controlled light source.

## Why it matters

Current limiting is the first rule of driving any component: LEDs, motors,
transistor bases, and communication lines all need something to set the current
to a safe level. Skipping it does not just risk one part -- in a dense circuit
the excess heat can damage neighbours too.

## Go further

- **The correct version:** [21-resistor-led](../21-resistor-led) -- the same
  LED with the resistor that makes it safe.
- **Understanding the numbers:** [34-ohms-law](../34-ohms-law) -- how to
  calculate what resistor value you need.
- **Experiment:** try resistor values of 100, 220, 470, and 1000 ohms and
  record the current each time. Plot current vs. resistance -- you will see a
  curve that is the reciprocal relationship V = I * R in action.
