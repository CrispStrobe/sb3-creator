---
level: beginner
age: 8+
prereqs: [pc01-led-resistor]
teaches: [breadboard-strips, mini-breadboard, no-power-rails]
---

## What you see

A tiny breadboard — the little white block with 170 holes and, unlike its big
brothers, **no red and blue stripes down the sides**. A resistor and a red LED
are pushed into it, the LED is lit, and only two wires are drawn on the whole
canvas: the two supply leads.

## Try this

1. Click **Sim**. The red LED lights.
2. Count the columns. The resistor's legs sit in **a3** and **a7**. The LED's
   legs sit in **b7** and **b8**. Notice that a7 and b7 are in the same
   column — that is the only reason the resistor reaches the LED.
3. Read the voltage where the resistor meets the LED. About **2.06 V**.
4. Now break it on purpose: open `circuit.json` and move the LED's `anode`
   from `b7` to `b6`. Run again — the LED goes dark. Nothing looks different,
   but column 6 and column 7 are separate strips.
5. Put it back to `b7`.

## What is going on

Inside a breadboard there are little metal clips. On this mini board, each
**column** of five holes (a, b, c, d, e above the gutter) is one clip. Any two
legs in the same column are connected, as if you had soldered them together.
Legs in different columns are not connected at all.

So the circuit reads like this. The + lead comes in at hole e3, which is column
3. The resistor's first leg is at a3 — same column, so it is connected. The
resistor's other leg is at a7, column 7, and the LED's anode is at b7 — same
column again, connected. The LED's other leg goes to column 8, and the return
lead comes in at e8. The loop is complete, and only two of those connections
were made by a wire you can see.

The current works out at (5 V − 2.06 V) ÷ 470 ohms = **6.25 milliamps**.

Big breadboards also have two long strips down each edge, called **power
rails**, for carrying + and − everywhere. This one has none. That is not a
defect — 170-point boards really are made like this, and building on one
teaches you that the rails were a convenience, never the thing that made the
circuit work.

## Why it matters

More first-hour breadboard bugs come from one leg in the wrong column than from
anything else. The board gives you no warning: it looks tidy and does nothing.
Learning to read the strips is learning to debug by eye.

## Go further

- **Next:** [pc16-mini-rc](../pc16-mini-rc) — a resistor and a capacitor
  meeting in one column, on the same little board.
- **Then:** [pc15-mini-npn](../pc15-mini-npn) — a transistor straddling three
  columns at once.
- **Experiment:** move the *whole* circuit four columns to the right (a3→a7
  becomes a7→a11, and so on, including the supply taps). It should behave
  exactly the same. If it does not, one hole did not move with the rest.
