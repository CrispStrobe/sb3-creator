---
level: advanced
age: 14+
prereqs: [lab-tilt-table]
teaches: [integrator, charge-pump, analog-memory, meter-protection]
---
## What you see
An op-amp with a capacitor in its feedback path, three buttons (**Up**, **Down**, **Zero**) and a moving-coil meter. Each of Up and Down has its own small capacitor and a pair of diodes.

## Try this
1. Click **Sim**. The meter rests at zero.
2. Tap **Up** once. The needle jumps up a step and stays there. Tap again: another step of the same size.
3. Now press **Up** and hold it for a second. Still just one step.
4. Tap **Down**: one step back.
5. Press **Zero**, then tap **Down** once more. The needle wants to go below zero, but it only twitches a little backwards.

## What is going on
Each button throws one end of a small capacitor from one battery pole to the other. The other end is steered by two diodes: on the press the capacitor's charge is pulled out of (or pushed into) the integrator's input, on the release it refills from the reference. So each press delivers exactly one capacitor-full of charge, whether you hold it for a moment or a minute. The integrator piles these packets up on its big capacitor and holds the total: its output is a memory that counts taps. The diode across the meter does nothing while the needle reads forwards. Driven backwards, it starts to conduct at a few tenths of a volt and stops the needle from being slammed against its stop.

## Go further
- [lab-tilt-table](../lab-tilt-table) — the same integrator fed with a steady current instead of charge packets.
- [lab-toggle-flip-flop](../lab-toggle-flip-flop) — a memory with only two states.
