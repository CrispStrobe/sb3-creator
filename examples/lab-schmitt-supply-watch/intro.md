# Schmitt trigger as a battery watchdog

A warning light that comes on when the battery runs down — and does not flicker on and off while it hovers near the limit, because it switches back only at a clearly higher voltage.

**Teaches:** Schmitt trigger, hysteresis, battery monitoring

## What to do

Click **Sim**. Turn the **pot** slowly down to 0.45 and back up, watching the yellow LED. Then set it to 0.6 and lower the **battery** voltage step by step to 7 V and back to 9 V.

## What you should see

- The LED comes on at one pot setting and goes off at a higher one.
- With the battery: on below about 7.25 V, off again only above about 8.25 V.

## Why it works

Both transistors share one emitter resistor. When Q2 takes over it raises the shared emitter voltage less than Q1 did, so Q1 then needs a higher base voltage to win back. The LED and diodes in the input path take a nearly fixed 2.6 V off the pot's share of the battery, so a weaker battery hands Q1 a disproportionately smaller voltage.
