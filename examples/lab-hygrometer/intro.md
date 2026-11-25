---
level: advanced
age: 14+
prereqs: [lab-humidity-comb, lab-opamp-gain]
teaches: [humidity-sensor, inverting-amplifier, transimpedance, meter]
---
## What you see
The salt-film humidity comb feeds an op-amp stage, and a moving-coil meter shows the result. A knob in the feedback path sets the gain.

## Try this
1. Click **Sim** and read the meter in room air.
2. Slide the humidity up in small steps. How much does the reading grow for each 5 %?
3. Breathe on the comb (**Breath**): the needle hits the end stop. Turn the gain down until it fits on the scale.
4. Turn the gain up again and find the lowest humidity the meter still shows clearly.

## What is going on
The comb sits between the battery and the op-amp's inverting input. The op-amp holds that input at the reference voltage, so the current through the comb is simply 4.5 V divided by the comb's resistance. All of it must flow through the feedback resistor, and that makes the output drop below the reference by current times feedback resistance. The meter reads that drop. A wetter salt film conducts better, so more current flows and the needle moves further. Because the film's resistance changes so steeply, the gain knob decides which humidity range fills the scale.

## Go further
- [lab-humidity-comb](../lab-humidity-comb) — the same comb switching a MOSFET.
