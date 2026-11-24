---
level: advanced
age: 14+
prereqs: [lab-mosfet-vcr, lab-opamp-integrator]
teaches: [integrator, voltage-controlled-resistor, volume-control, analog-memory]
---
## What you see
One op-amp plays a tone into an earphone. Between them a MOSFET leaks the tone away to its source, and a second op-amp with a capacitor holds the MOSFET's gate voltage. Two buttons: softer and louder.

## Try this
1. Click **Sim** and listen: the tone is barely there.
2. Hold **louder** for a moment. The tone grows to full volume.
3. Tap **softer** a few times. Each tap turns it down a step, and between taps it stays where you left it.
4. Put a scope probe on the op-amp output (the MOSFET's first gate) and watch it move up and down in steps.

## What is going on
The op-amp with the capacitor in its feedback path is an integrator. While a button is pressed, a small current flows into or out of its inverting input, and the op-amp keeps that input at half the supply by charging the capacitor: its output moves steadily up or down. Let go, and the current stops, so the output stays put. The capacitor is a memory for a voltage. That voltage drives the MOSFET's gate. With the gate high the channel is only about a hundred ohms and swallows most of the tone. With the gate more than about 1.2 V below the source the channel is cut off and the whole tone reaches the earphone. In between, the channel is a resistor set by the gate voltage, so the buttons work like a volume knob with no moving parts.

## Go further
- [lab-mosfet-vcr](../lab-mosfet-vcr) — the channel as a voltage-controlled resistor, measured.
- [lab-dual-gate](../lab-dual-gate) — what the second gate does.
