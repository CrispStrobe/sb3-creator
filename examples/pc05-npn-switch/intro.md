---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor]
teaches: [npn-transistor, switching, amplification]
---
## What you see
An NPN transistor controls an LED. A small current into the base turns on a much larger current through the collector, lighting the LED.

## Try this
1. Click **Sim** and observe the LED state.
2. Look at the base voltage — it sits near 0.7 V, the forward voltage of the base-emitter junction.
3. Try removing the base resistor (set it very high). The transistor turns off and the LED goes dark.

## What is going on
An NPN transistor has three pins: base, collector, and emitter. A small base current (here about 0.43 mA through the 10 kΩ resistor) controls a much larger collector current (up to 5.96 mA through the 470 Ω resistor and LED). When enough base current flows, the transistor saturates — it acts like a closed switch between collector and emitter, with only about 0.2 V across it. The current gain (beta) of 100 means the collector can carry 100 times the base current.

## Why it matters
Transistor switching is the foundation of all digital electronics. Every logic gate, every processor, and every motor driver uses transistors as electronically controlled switches — turning large currents on and off with tiny control signals.

## Go further
- [pc23-transistor-switch](../pc23-transistor-switch) — a more complex transistor switching circuit.
- [pc32-pnp-high-side](../pc32-pnp-high-side) — the complementary PNP transistor, switching on the high side.
- Experiment: calculate the minimum base current needed to saturate this transistor (Ic/beta), then find the resistor value that delivers exactly that.
