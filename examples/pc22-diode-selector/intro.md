---
level: intermediate
age: 12+
prereqs: [pc13-direct-diode, pc08-diode-polarity]
teaches: [diode-or, back-feeding, redundant-supply, forward-drop]
---

## What you see

Two 5 V supplies on the left, each with its own diode, both diodes pointing the
same way into one shared wire. From there, a 1 kΩ resistor and a green LED go
to ground. Two ways in, one load, and the two supplies never touch each other
directly.

## Try this

1. Click **Sim**. The LED lights, and the shared node reads about **4.29 V** —
   5 V minus one diode's 0.71 V.
2. Turn **source A** off (set it to 0 V) and run again. The LED current goes
   from 2.266 mA to **2.255 mA**. Half a percent. You would never see it.
3. Put A back and turn **source B** off instead. The same thing: 2.255 mA.
4. Turn **both** off. Now the node is at 0 V and the current is 0 mA.
5. The interesting one: set source A to **9 V** and leave B at 5 V. The shared
   node jumps to **8.24 V**. Now look at source B's diode — 5 V on its anode,
   8.24 V on its cathode. It is pointing uphill, so it is blocking.

## What is going on

A diode is a one-way valve, and this circuit is two valves emptying into the
same tank.

Whichever supply is highest gets to fill the tank. Its diode is forward-biased
and conducts. The other supply now finds the shared node sitting *above* its own
voltage, which pushes its diode backwards — and backwards, a diode does nothing.
It disconnects itself.

That is why step 2 changed almost nothing. The load never cared which supply
was feeding it. And it is why step 5 matters more than it looks: **without the
diodes, the 9 V supply would be pushing current backwards into the 5 V one.**
Depending on what those supplies are, that ranges from wasteful to dangerous —
a battery being charged by a wall adapter that was never designed to charge it
is a genuinely popular way to start a fire.

Arrangements like this get called a **diode OR**, because the load runs if
source A *or* source B is alive. It is the cheapest possible automatic
changeover: no switch, no logic, no moving parts, and no gap during the
handover, because the second diode starts conducting the instant the first
supply sags below it.

The bill is that 0.71 V. Every diode in the path eats some, and it is dissipated
as heat, and it is why real designs sometimes replace these with Schottky
diodes (about 0.3 V) or with transistors arranged to do the same job for almost
nothing.

## Why it matters

Every device that runs on either mains power or its own battery has this
somewhere: laptops, UPS units, alarm panels, anything with a backup cell to keep
a clock running. So does every board where you might plug in USB power while a
battery is already connected — which is most hobby boards, and the reason they
have a small diode near the power jack that beginners often wonder about.

## Go further

- **Next:** [pc61-diode-or](../pc61-diode-or) — the same idea presented as a
  logic function rather than a power circuit.
- **Then:** [pc38-relay-changeover](../pc38-relay-changeover) — the mechanical
  way to do the same job, with its own trade-offs.
- **Experiment:** replace both diodes with Schottky types by setting `vf` to
  `0.3`. Predict the new shared-node voltage and LED current before you run it,
  then check. (Hint: the load gets 0.4 V more, and it is the 1 kΩ resistor that
  turns that into extra current.)
