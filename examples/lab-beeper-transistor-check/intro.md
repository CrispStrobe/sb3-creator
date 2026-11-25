# Transistor tester with a beeper

The beeper from the diode tester, now on a transistor. Six switches are the probe clips: the red one can go on the base, the collector or the emitter, and so can the black one. Which pairs beep shows that a transistor is two diodes back to back.

**Teaches:** transistor junctions, finding the base, continuity testing

## What to do

Click **Sim**. Close one red clip (switch_19 base, switch_20 collector, switch_21 emitter) and one black clip (switch_22 base, switch_23 collector, switch_24 emitter), listen, then open both again. Try all six pairs.

## What you should see

- Red on the base, black on the emitter: beep. Red on the base, black on the collector: beep.
- The same two pairs the other way round: silence.
- Collector and emitter, either way: silence.

## Why it works

Inside an NPN transistor the base meets the emitter in one diode and the collector in another; both diodes point away from the base. Current can therefore go in at the base and out at either end, but never in at an end and out at the base, and never straight from collector to emitter while the base gets nothing.
