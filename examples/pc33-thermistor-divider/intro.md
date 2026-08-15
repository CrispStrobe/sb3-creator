---
level: beginner
age: 12+
prereqs: [pc02-voltage-divider]
teaches: [thermistor, ntc, sensor, voltage-divider, resistance-to-voltage]
---

## What you see

Two components in a line between 5 V and ground, and a wire coming off the point
between them. The top one is a **thermistor** — a resistor whose value depends on
how warm it is. The junction is the circuit's output, and it is the only thing
here worth measuring.

## Try this

1. Click **Sim** and drag the NTC's temperature control to cold. The junction
   reads **0.45 V**.
2. Drag it to hot. The junction reads **4.55 V**.
3. Put it exactly in the middle: **2.50 V**, precisely half the supply.
4. Check step 3 with the divider formula: the NTC is 10 kΩ there, the same as
   `r1`, and two equal resistors always split a supply in half.
5. Change `r1` from 10000 to 1000 ohms and sweep the control again. The whole
   output range shifts downwards — the circuit is now most sensitive at a
   different temperature.

## What is going on

A thermistor turns temperature into resistance. That is genuinely useful, but
nothing in your circuit can read resistance directly — meters, chip inputs and
comparators all read *voltage*. The divider is the translator.

The rule is the same one as any voltage divider: the junction sits at the supply
times the bottom resistance over the total. When the NTC is cold it is
100 kΩ — huge compared to the 10 kΩ below it — so it takes almost the whole 5 V
for itself and the junction is left near the bottom, at 0.45 V. Heat it up and
its resistance collapses to 1 kΩ; now `r1` is the big one, so it keeps most of
the voltage, and the junction rises to 4.55 V.

**NTC** means *negative temperature coefficient*: hotter means less resistance,
which is backwards from the metal wires you are used to and is exactly what makes
these devices useful as sensors.

Step 5 is the design decision hiding in this circuit. `r1` sets *where* the
divider is most sensitive. The output moves fastest when the two resistances are
similar, so choosing `r1` = 10 kΩ means "be most sensitive where the thermistor
is 10 kΩ" — you pick `r1` to match the temperature you actually care about,
which for a room-temperature sensor is the thermistor's value at about 25 °C.

## Why it matters

Every thermostat, fridge, 3D-printer hot end and battery charger has one of
these, usually feeding a microcontroller's analogue input directly. The same
two-resistor trick reads light (swap in an LDR), pressure, moisture and stretch —
any sensor whose output is a resistance becomes a voltage this way.

## Go further

- **First:** [pc02-voltage-divider](../pc02-voltage-divider) — the same formula
  with both resistors fixed.
- **Compare:** [pc24-light-gate](../pc24-light-gate) — the light-sensing version
  of exactly this circuit.
- **Next:** [pc55-ntc-indicator](../pc55-ntc-indicator) — the divider driving
  something instead of just being measured.
- **Then:** [pc48-ldr-comparator](../pc48-ldr-comparator) — turning the sliding
  voltage into a yes/no decision.
- **Experiment:** swap the NTC and `r1` so the thermistor is the *bottom*
  resistor. Sweep again: the output now falls as things get hotter. Sometimes
  that is what you want, and it costs nothing but the order of two parts.
