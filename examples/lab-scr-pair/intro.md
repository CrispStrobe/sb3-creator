---
level: advanced
age: 14+
prereqs: [pc05-npn-switch, lab-transistor-flip-flop]
teaches: [thyristor, latch, positive-feedback, holding-current]
---
## What you see
An NPN and a PNP transistor, a red LED, a gate button and a main switch. Together the two transistors behave like a thyristor (SCR), a switch that stays on once it has been fired.

## Try this
1. Click **Sim**. The LED is dark.
2. Tap the gate button. The LED lights.
3. Let go, and tap it again. The LED just stays on: the gate can only switch it on.
4. Slide the main switch off and back on. Now the LED is dark until the next gate pulse.

## What is going on
The NPN's collector pulls current out of the PNP's base, and the PNP's collector pushes current into the NPN's base. Once a little current flows, each transistor keeps the other one on: a loop with positive feedback. The gate pulse only starts the loop. After that the current through the load keeps it going, so the only way to stop it is to interrupt that current. Real thyristors are built exactly like this, as four layers of silicon in one package, and are used to switch lamps, motors and flash units.

## Go further
- [lab-transistor-flip-flop](../lab-transistor-flip-flop) — two NPNs in a loop: memory with two stable states.
- [lab-pnp-npn-relax](../lab-pnp-npn-relax) — the same pair, fired by a charging capacitor, becomes an oscillator.
