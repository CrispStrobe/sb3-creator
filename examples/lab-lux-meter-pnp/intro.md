# Lux meter: a PNP stage and an op-amp follower side by side

Two light meters built two ways. In one a PNP transistor carries the phototransistor's signal to the meter, in the other an op-amp follower does. Give both the same light and compare.

**Teaches:** the phototransistor as a current source, the PNP transistor stage, the voltage follower, offset and proportionality

## What to do

Click **Sim**. Set both phototransistors' light sliders to the same value: 0, 0.02, 0.05, 0.1, 0.2. Compare the two meters each time.

## What you should see

- Both readings grow by about 2.4 V for each 0.1 of light.
- At very low light (0.02) only the follower moves (0.47 V); the PNP meter stays at zero.
- At 0.1 of light: PNP about 1.7 V, follower about 2.35 V.

## Why it works

A phototransistor lets through a current proportional to the light. Through 4.7 kΩ that becomes a proportional voltage, which the op-amp follower hands to the meter unchanged. The PNP transistor works from the top: once the voltage across its base resistor exceeds about 0.65 V, its emitter resistor gets the rest of that voltage and the collector passes the same current into the meter. The PNP meter has the same slope but starts later.
