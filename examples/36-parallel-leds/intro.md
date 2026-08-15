---
level: beginner
age: 8+
prereqs: [21-resistor-led]
teaches: [parallel-circuit, branch-current, current-limiting-resistor]
---

## What you see

Two LEDs, one red and one green, both lit at the same brightness. Each one has
its own resistor sitting above it. There is no chip in this circuit and no
program — power goes in, and the lights come on.

## Try this

1. Click **Sim** to power the circuit up. Both LEDs light.
2. Follow the wires with your finger from the 5 V symbol at the top. The path
   splits in two: one road goes through R1 to the red LED, the other through R2
   to the green LED. Both roads end at ground.
3. Read the voltage at the point between R1 and the red LED. You should see
   about **2 V**.
4. Open `circuit.json` and change `r2` from `1000` to `4700` ohms. Run it
   again. The **green** LED goes dim. The red one does not change at all.
5. Put `r2` back to `1000`.

## What is going on

Each LED has its own road to travel on, and the two roads do not get in each
other's way. That is what **parallel** means.

Follow one road. The battery pushes with 5 V. The LED uses up about 2 V just by
being an LED — it always takes about the same amount, no matter what. That
leaves 3 V for the resistor to deal with. A 1000 ohm resistor with 3 V across
it lets through 3 volts ÷ 1000 ohms = **0.003 amps**, which we usually call
**3 milliamps**. That is the current lighting the red LED.

Now the other road: same 5 V, same kind of LED, same resistor. So the same
3 milliamps. Same brightness. The two roads never had to share.

What about the power supply? It has to push both roads at once, so it sends out
3 + 3 = **6 milliamps** in total. In a parallel circuit you add the branches up
to get the total.

That is also why step 4 only dimmed one LED. Making R2 bigger squeezed the
green road, but the red road never noticed.

## Why it matters

Every light in your house is wired in parallel — that is why switching off the
kitchen light does not darken your bedroom. It is also the rule that says every
LED needs its **own** resistor, not one resistor shared between them.

## Go further

- **Next:** [35-series-resistors](../35-series-resistors) — what happens when
  parts share one road instead of getting their own.
- **Then:** [22-series-parallel](../22-series-parallel) — the two wiring styles
  side by side.
- **Also fun:** [40-led-color-mix](../40-led-color-mix) — three parallel
  branches making any colour you like.
- **Experiment:** add a *third* branch — another 1000 ohm resistor and another
  LED, wired like the first two. Predict the total current before you run it.
  (Hint: 3 + 3 + 3.)
