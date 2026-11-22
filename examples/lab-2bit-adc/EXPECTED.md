# lab-2bit-adc — expected behaviour

## Circuit
5 V. A 10 kΩ potentiometer is the analog input. Four 10 kΩ resistors in a ladder give thresholds of 1.25 V, 2.5 V and
3.75 V. Three comparators (ideal op-amp parts, output 0 or 5 V) compare the input with each threshold: C1, C2, C3.
A 74HC14 inverts C2 twice (NOT C2 for the logic, and a clean copy of C2 for the MSB LED); a 74HC08 forms C1 AND NOT C2;
a 74HC32 ORs that with C3 to make the LSB. Two red LEDs with 470 Ω show MSB and LSB.

## Observable behaviour
- The comparators give a "thermometer code": the higher the input, the more of them are high.
- The gates turn it into binary: MSB = C2, LSB = (C1 AND NOT C2) OR C3.

| input | C1 C2 C3 | MSB LSB |
|---|---|---|
| below 1.25 V | 0 0 0 | 0 0 |
| 1.25 – 2.5 V | 1 0 0 | 0 1 |
| 2.5 – 3.75 V | 1 1 0 | 1 0 |
| above 3.75 V | 1 1 1 | 1 1 |

- As loaded (pot at 0.6, input 3.0 V) the LEDs read 10: MSB lit (about 6 mA), LSB dark.
- Every input between two thresholds gives the same code: that rounding is quantisation.

## What this verifies
1. A flash converter: one comparator per threshold, all at once.
2. Thermometer code to binary with three gates.

```assert
# input 3.0 V -> code 10
net potentiometer_3.wiper V 3.00 +-0.02
net resistor_11.b V 2.50 +-0.01
net 74hc14_7.2y V 4.70 +-0.10
net 74hc32_9.1y V 0.00 +-0.05
```
