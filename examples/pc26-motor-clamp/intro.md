---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor, pc08-diode-polarity]
teaches: [inductance, flyback, freewheel-diode, back-emf, switch-arcing]
---

## What you see

A 9 V supply, a switch, and a motor. The extra part in series with the motor
(`l1`) is the motor's own winding — a coil of wire, drawn separately so you can
see it. The diode sitting across the load looks backwards: its cathode points at
the positive side, so it never conducts while the motor is running. It is there
for one moment only.

## Try this

1. Click **Sim** and close `sw1`. The motor runs; the switched node sits at
   **9 V**.
2. Open `sw1` and watch that node **immediately** — within microseconds. It dips
   to about **−9.7 V** and recovers.
3. Now delete `d1` and its two wires, and repeat. Sampling every microsecond,
   the same node hits **−900 V**.
4. Sample ten times faster still (every 0.1 µs). Without the diode you now read
   **−9000 V**. With the diode back in, it stays at about −9.7 V no matter how
   fast you look.

## What is going on

A coil stores energy in a magnetic field, and it hates having its current
interrupted. Current through a coil behaves like something heavy that is already
moving: you cannot stop it instantly, and if you try, it pushes back — hard.

The size of that push is `V = L × (change in current) ÷ (time it takes)`. Open a
perfect switch and the time is zero, so the voltage goes to infinity. That is
exactly what step 4 shows: every time you sample ten times faster you catch a
spike ten times bigger, because the model has no floor to hit. On a real bench
it stops at the point where the air inside the switch breaks down and a spark
carries the current instead. That spark is what eats switch contacts, and the
same spike is what kills the transistor if a transistor was doing the switching.

The diode fixes it by giving the current a legal way home. While the motor runs,
the diode is reverse biased and does nothing. The instant the switch opens, the
node swings negative — and a negative node is exactly what turns that diode on.
Now the current has a loop: through the coil, through the motor, through the
diode, and back. It winds down over the next fraction of a millisecond, and the
voltage never gets past about a diode drop below ground.

That is why it is called a **freewheel** or **flyback** diode: it lets the coil
coast to a stop instead of crashing.

## Why it matters

Every motor, every relay coil, every solenoid gets one of these. It is one
component, it costs almost nothing, and leaving it out is the classic way to
destroy a motor driver — not immediately, but on the tenth or hundredth
switch-off, which makes it a horrible fault to diagnose.

## Go further

- **Related:** [pc56-inductor-freewheel](../pc56-inductor-freewheel) — the same
  effect with a bare inductor and no motor in the way.
- **Compare:** [33-inductive-no-flyback](../33-inductive-no-flyback) — the same
  lesson told through a transistor driver.
- **Experiment:** put the diode in the other way round (swap `anode` and
  `cathode` in `circuit.json`) and run step 1. It now conducts straight across
  the supply while the switch is closed — a short circuit. Backwards is not
  "just useless", it is worse than nothing.

**Note:** `l1`'s value is currently not adjustable — the engine reads a
different spelling of the inductance parameter than the one examples declare, so
1 mH is what you get whatever you type. The comparison above works because both
sides of it use the same value.
