---
level: beginner
age: 8+
prereqs: [pc01-led-resistor]
teaches: [series-resistor, voltage-divider, active-buzzer]
---

## What you see

Three things in one loop: the 5 V supply, a 100 ohm resistor, and a buzzer.
That is the entire circuit. No chip, no program, nothing to press.

## Try this

1. Click **Sim** and read the voltage on the buzzer's + terminal. You should
   see exactly **2.5 V** — half the supply.
2. Ask yourself why it is exactly half. (The buzzer behaves like a 100 ohm
   resistor, and there is a 100 ohm resistor above it. Two equal parts, so
   they split the 5 V evenly.)
3. Work out the current: 5 V across 100 + 100 = 200 ohms, so 5 ÷ 200 =
   **0.025 amps**, which is **25 milliamps**.
4. Open `circuit.json` and change the resistor from 100 to **47** ohms. Now the
   buzzer's share rises to about 3.4 V and the current to about 34 mA — on a
   real bench, louder.
5. Try **1000** ohms. The buzzer gets only about 0.45 V and barely 4.5 mA. On a
   real bench, almost inaudible.

## What is going on

There are two kinds of buzzer, and telling them apart is most of what this
example is for.

A **passive** buzzer (often sold as a piezo element) is a bare disc. Give it
steady DC and it clicks once as it flexes, then sits there silently. To make a
note you have to wiggle its voltage up and down thousands of times a second —
that is a job for a microcontroller pin or a 555 timer.

An **active** buzzer has a tiny oscillator sealed inside it. Give it steady DC
and it does the wiggling for you. One connection, one continuous tone, no
program. That is the kind this example is built around, and it is why the
circuit has no chip in it.

The resistor is not there to protect the buzzer, exactly — it is there to give
you a volume control. Buzzer and resistor share the 5 V in proportion to their
resistance, which is the same voltage-divider idea as any two resistors in a
row. Equal values, equal shares, hence the tidy 2.5 V. Make the resistor
smaller and the buzzer keeps more of the supply and gets louder; make it bigger
and the buzzer gets quieter. Step 4 and step 5 are the two ends of that.

## Why it matters

Buying the wrong buzzer is a classic afternoon lost: you wire up an "active"
buzzer expecting silence until your program tells it to beep, and it screams
the moment you power the board. Or you wire a passive one and get nothing at
all, and go looking for a fault that is not there. The part you have decides
the circuit you need.

## Go further

- **Next:** [pc53-buzzer-switch](../pc53-buzzer-switch) — the same buzzer with
  a switch, so it is not on all the time.
- **Then:** [07-buzzer-siren](../07-buzzer-siren) — a *passive* buzzer driven
  by a program, sweeping through a range of notes.
- **Experiment:** which resistor would give the buzzer exactly 4 V? (It needs
  4 of the 5 volts, leaving 1 V for the resistor, so the resistor must be a
  quarter of the buzzer's 100 ohms — 25 ohms. Try 22, the nearest standard
  value, and see how close you land.)
