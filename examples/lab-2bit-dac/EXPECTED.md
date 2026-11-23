# lab-2bit-dac — expected behaviour

## Circuit
LM324 on a split ±9 V supply (two 9 V sources around ground). A 1.5 V cell is the reference. Two slide switches are
the bits: in position b a switch connects the reference, in position a it connects ground. Bit 1 feeds the summing
node through 15 kΩ, bit 0 through 30 kΩ (twice as much, half the weight). Amplifier 1 sums with 10 kΩ feedback;
amplifier 2 inverts again with 10 kΩ / 10 kΩ so the result is positive. A voltmeter reads the output.

## Observable behaviour
- Output = reference × (10 kΩ / 15 kΩ × bit1 + 10 kΩ / 30 kΩ × bit0), that is one volt for bit 1 plus half a volt for bit 0.
- The four codes give four equal steps (switch states are exercised by test/lab-circuits-4.test.mjs):

| bits | output, volts |
|---|---|
| 00 | 0.0 |
| 01 | 0.5 |
| 10 | 1.0 |
| 11 | 1.5 |

- As loaded the switches read 10, so the meter shows 1.0 V; the first amplifier's output is −1.0 V.

## What this verifies
1. Binary weighting: each bit's resistor is half the next lower bit's.
2. The summing amplifier adds the currents without the inputs disturbing each other (its input stays at 0 V).

```assert
# code 10
net vsource_5.pos V 1.50 +-0.01
net resistor_12.b V 1.00 +-0.01
```
