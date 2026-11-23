# Measuring hundredths of a millimetre with light

Two pieces of light guide meet end to end. The narrower the gap between them, the more light gets across, and a phototransistor with an NPN/PNP pair turns that into a meter reading. A gap change thinner than a hair moves the needle.

**Teaches:** coupling loss at a fibre joint, contactless measurement, the complementary (Sziklai) pair

## What to do

Click **Sim**, then turn the light guide's knob slowly from 0 to 0.5 mm and watch the meter.

## What you should see

- Gap closed: about 7.9 V.
- 0.05 mm: already more than half a volt less.
- 0.1 mm: about 6.4 V; 0.5 mm: about 2.8 V.

## Why it works

Light leaves the first fibre in a cone. Across a wider gap the cone grows and the second fibre catches a smaller part of it. The phototransistor's current makes a voltage across 47 kΩ, and the NPN/PNP pair passes that voltage to the meter while drawing almost no current from it.
