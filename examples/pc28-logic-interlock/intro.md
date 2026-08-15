---
level: intermediate
age: 12+
prereqs: [pc36-series-interlock, pc01-led-resistor]
teaches: [and-gate, logic-levels, pull-down-resistor, floating-input, truth-table]
---

## What you see

Two switches, a logic gate, and an LED. The two extra resistors going down to
ground are not decoration — take them away and this circuit stops being
reliable. The LED lights only when both switches are closed.

## Try this

1. Click **Sim** and try all four combinations: neither switch, only `sw_a`,
   only `sw_b`, then both.
2. Write down what the LED does for each. That table is the whole point of the
   circuit — it is called a **truth table**.
3. Measure `gate1.out`. It is **0 V** in three of the four cases and **4.86 V**
   in the fourth.
4. Measure `in0` while `sw_a` is open. It reads **0 V**, held there by
   `pull_a`.
5. Now delete `pull_a` and its wires, and open `sw_a` again. That input is now
   connected to nothing at all, and the gate is guessing.

## What is going on

An AND gate answers one question: *are all of my inputs high?* Two switches, four
possible answers, and only one of them is yes.

You have already built this with two switches in series
([pc36](../pc36-series-interlock)), so why bother with a chip? Because these two
inputs are now **decisions, not current paths**. The switches do not carry the
LED's current — they only inform the gate, which does the driving. That means
the two conditions can come from anywhere: one from a switch, one from a sensor,
one from a microcontroller pin, one from another gate's output. In series wiring,
everything has to be on the same wire. In logic, nothing does.

Now the resistors. A CMOS input is almost infinitely high impedance — it looks
at the voltage and draws essentially no current. So an input wired to nothing
does not read 0 V; it holds whatever charge happens to be sitting there, and
picks up hum from your hand and the wires nearby. It **floats**, and a floating
input makes a gate flicker between answers for no reason.

`pull_a` and `pull_b` fix that. Each is a gentle 100 kΩ tie to ground: when the
switch is open, that resistor quietly holds the input at a solid 0 V. When the
switch closes, 5 V comes through a near-zero resistance and wins easily — the
pull-down then just leaks 5 V / 100 kΩ = 0.05 mA to ground, which nobody misses.
Strong enough to decide, weak enough to be overruled.

## Why it matters

"Two independent conditions must both be true" is a safety pattern: a press that
needs both hands on the buttons, a microwave that needs the door shut *and* the
timer running. And every button you ever wire to a microcontroller needs a pull-
down or pull-up for exactly the reason in step 5 — it is the single most common
beginner's fault in digital electronics.

## Go further

- **Compare:** [pc36-series-interlock](../pc36-series-interlock) — the same
  logic with no chip at all, and why that is not always enough.
- **Next:** [19-logic-or-gate](../19-logic-or-gate) — the *either* version.
- **Then:** [pc45-nand-test](../pc45-nand-test) — the gate you can build
  everything else out of.
- **Experiment:** change `pull_a` from 100000 to 1000000 ohms. It still works.
  Now think about why the designers of real boards do not just use 10 MΩ
  everywhere. (Hint: what else is connected to that wire, and how quickly can
  0.05 µA drain it?)
