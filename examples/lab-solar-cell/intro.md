# What a solar cell can and cannot do

A single solar cell gives a little over half a volt, and a current that grows with the light. Load it with different resistors and you trace its curve; somewhere in the middle it gives the most power. Too weak to switch on a transistor by itself, it can when it only has to add the last bit on top of a small bias.

**Teaches:** photovoltaic sources, current-voltage curve, maximum power point, biasing

## What to do

Click **Sim**. Turn the load pot of cell 1 and note voltage and current at several positions, then switch the load off. Change the light of the cells from dark to full. Flip the bias switch of cell 2.

## What you should see

- The voltage stays near 0.5 to 0.6 V over a wide range of light; the current changes a lot.
- The most power at a middle load, not at the extremes.
- The green LED lights with very little light, but only while the bias is in.
- The fan only turns in good light.

## Why it works

Light frees charge carriers inside the cell; that makes a current proportional to the light. The cell is also a diode, and that diode limits the voltage to about 0.6 V however bright it gets. With a small load the diode takes the current away; with a big load the voltage collapses. A transistor's base needs about 0.65 V before it conducts, a bit more than one cell gives, so the divider supplies most of it and the cell supplies the rest.
