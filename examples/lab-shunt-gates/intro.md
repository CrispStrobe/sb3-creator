---
level: beginner
age: 10+
prereqs: [pc36-series-interlock, pc61-diode-or]
teaches: [logic-gates, not, nand, nor, shunt-switching, truth-table]
---
## What you see
Three lamps and five buttons, no chip and no transistor. Every lamp is lit at the start. The buttons are wired across the lamps, not in front of them.

## Try this
1. Click **Sim**: all three LEDs are on. With every input at 0, NOT, NAND and NOR all give 1.
2. Press the NOT button: its LED goes dark.
3. On the NAND channel, press A only, then B only, then both. Only both together switch it off.
4. On the NOR channel, any single button is enough.
5. Watch the battery current. It is highest when all lamps are dark!

## What is going on
A closed button across a lamp steals its current: the lamp is dark exactly when the button path conducts. Two buttons in series conduct only if both are pressed (AND), so shorting the lamp with them gives NOT-AND. Two in parallel conduct if either is pressed (OR), which gives NOT-OR. The resistor in front stays in the loop all the time, so the battery is never shorted — but it now carries more current than with a lit lamp, which is why shunt logic wastes power.

## Go further
- [pc36-series-interlock](../pc36-series-interlock) — buttons in series as AND.
- [pc93-nand-is-universal](../pc93-nand-is-universal) — every gate from NAND.
- [lab-touch-off](../lab-touch-off) — a transistor doing the shunting.
