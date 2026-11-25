# Square and cube roots with logarithmic amplifiers

Before pocket calculators, roots were taken with logarithms: halve the logarithm, and you have the logarithm of the square root. This circuit does the same with transistors, whose voltage is the logarithm of their current.

**Teaches:** logarithms, log and antilog amplifiers, analogue computing

## What to do

Click **Sim**. Turn **INPUT** to the top (x = 100 on the input meter) and read the output meter (1 V = 10). Try x = 25. Then slide **ROOT** to the cube root and try x = 100 and x = 8.

## What you should see

- Square root: 100 → about 10, 25 → about 5.
- Cube root: 100 → about 4.6, 8 → about 2.

## Why it works

The first op-amp forces the input current through a transistor; the transistor's base-emitter voltage is then proportional to the logarithm of that current. A second stage does the same for a fixed 1 µA. A divider halfway between the two voltages is their average, the logarithm of the square root of the product; one third of the way is the cube root. A last transistor turns that voltage back into a current, which the meter shows.
