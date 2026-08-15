---
level: intermediate
age: 12+
prereqs: [pc14-mini-led, pc05-npn-switch]
teaches: [npn-switch, base-current, current-gain, saturation]
---

## What you see

A mini breadboard with four parts on it: a 10 kΩ resistor feeding the base of
an NPN transistor, and a 470 Ω resistor with a red LED forming the load above
the transistor's collector. The transistor straddles three columns at once —
emitter in column 7, base in column 8, collector in column 9 — which is exactly
how a TO-92 transistor sits on a real board.

## Try this

1. Trace the two paths from column 2, where the + lead comes in. One goes
   through the 10 kΩ resistor to column 8 — that is the **base**. The other
   goes through the 470 Ω resistor and the LED down to column 9 — that is the
   **collector**.
2. Read the base voltage (column 8). About **0.70 V**, and it will stay near
   0.70 V no matter what you do to the rest of the circuit.
3. Work out the base current yourself: the resistor has 5 − 0.70 = 4.3 V
   across it, so 4.3 ÷ 10 000 = **0.43 mA**.
4. Change the base resistor from 10 kΩ to 100 kΩ in `circuit.json`. The base
   voltage barely moves — still about 0.7 V — but the base *current* drops to
   about 43 µA, a tenth of what it was.

## What is going on

A bipolar transistor is a current amplifier. Whatever current you push into the
base, it tries to pull **β times that** through the collector. Here β is 100,
so 0.43 mA into the base means the transistor is asking for 43 mA at the
collector.

It cannot have it. Look at what the collector branch can actually deliver: 5 V
in, about 2 V eaten by the LED, and about 0.2 V left across the transistor
itself when it is switched hard on. That leaves roughly 2.8 V across the 470 Ω
resistor, so **about 6 mA** — and no amount of asking will produce more.

That mismatch is not a fault, it is the whole point. When a transistor is asked
for more current than the circuit can supply, it stops behaving like an
amplifier and behaves like a **closed switch**: collector pinned about 0.2 V
above the emitter, current set entirely by the load resistor. Engineers call
this **saturation**, and it is the state you deliberately design for whenever
you want a transistor to switch something on and off cleanly rather than to
amplify.

The rule of thumb that follows: to switch, give the base far more current than
β alone would require. Asking for 43 mA to get 6 mA is a factor of seven of
headroom, and that headroom is what keeps the switch hard on even when β varies
from part to part — which it does, badly, sometimes by 3:1 between two
transistors from the same bag.

## Why it matters

Every relay driver, every motor driver, every LED that a microcontroller pin is
too weak to run directly, is this circuit. The pin supplies a fraction of a
milliamp into a base resistor, and the transistor supplies the amps.

## Go further

- **Next:** [pc23-transistor-switch](../pc23-transistor-switch) — the same
  switch with a button in the base path, so you can turn it on and off.
- **Then:** [pc24-light-gate](../pc24-light-gate) — the base driven by a light
  sensor instead of a resistor.
- **Experiment:** predict what happens with a 1 MΩ base resistor. Base current
  becomes 4.3 µA, so the transistor asks for 0.43 mA — *less* than the 6 mA the
  load could supply. It leaves saturation and the LED goes dim. That is the
  boundary between "switch" and "amplifier", and you can find it by hand.
