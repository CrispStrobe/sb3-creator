---
level: beginner
age: 8+
prereqs: [pc01-led-resistor]
teaches: [series-circuit, and-logic, interlock, complete-circuit]
---

## What you see

Two switches, one after the other, then a resistor and an LED. Everything is on
one single loop of wire. There is no chip here and nothing to program.

## Try this

1. Click **Sim**. Both switches start open, and the LED is off.
2. Close just `sw1`. Still off.
3. Close just `sw2` instead. Still off.
4. Close both. **Now** it lights, at 2.97 mA.
5. With both closed, open either one. It goes out immediately — it does not
   matter which one you pick.

## What is going on

Electricity has to go all the way round. It leaves the supply, goes through the
first switch, the second switch, the resistor and the LED, and comes back. Every
single one of those has to be closed for the trip to happen. One gap anywhere and
the whole loop stops — not the part after the gap, the *whole* loop.

That is why step 5 works whichever switch you open. There is only one path, so
there is only one thing to break, and both switches are standing on it.

You have just built the rule "**this AND that**" out of nothing but wire. Two
switches in a row means both must be closed. It is the simplest logic gate there
is, and it needs no power of its own, no chip and no code.

Look at the numbers in step 4 if you like: with both closed, the full 5 V arrives
at the resistor, which is the same as if the switches were plain pieces of wire.
That is what a closed switch is — a piece of wire you can take away.

## Why it matters

Real machines are wired this way on purpose, and it is a safety idea, not a
convenience one. An industrial press only runs when both hand buttons are pressed
— so both your hands are demonstrably somewhere other than under the press. A
microwave needs the door catch closed *and* the start button pressed. That chain
is called an **interlock**, and it is often deliberately built out of plain
switches in series rather than software, because a wire cannot crash.

## Go further

- **Next:** [pc28-logic-interlock](../pc28-logic-interlock) — the same AND rule,
  built with a logic chip, and why anyone would bother.
- **Compare:** [pc42-parallel-paths](../pc42-parallel-paths) — two switches side
  by side instead of in a row, which turns AND into OR.
- **Experiment:** add a third switch to the chain. Predict how many of the eight
  possible combinations light the LED before you test them. (There is only one.)
