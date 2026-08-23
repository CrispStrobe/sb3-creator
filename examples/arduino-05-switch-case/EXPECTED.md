# arduino-05-switch-case — expected behaviour

## Circuit

Arduino Uno A0 <- LDR with 10 kohm pull-down resistor (VCC -> LDR -> A0 -> 10k -> GND). No LEDs — serial output only.

## Program

Reads LDR on A0, divides into 4 ranges (0-3) with `floor of (reading / 256)`,
and prints a label: "dark", "dim", "medium", or "bright". Updates every 500 ms.

The port originally wrote `(sensorReading / 1024) * 3`, which matched none of
the four `range = N` branches in EITHER target. In C that is integer division:
0 for every reading below 1024, so it always printed "dark". In the VM it is
floating point: 0.2988 at reading 102, 0.75 at 256, 1.1719 at 400 — equal to no
whole number, so nothing printed at all. `floor of (reading / 256)` gives the
boundaries this document already states, and the VM's floor and C's truncating
`/` agree on every value.

## Observable behaviour

- **Dark (sensor ~0):** serial prints **"dark"**.
- **Low light (~256):** serial prints **"dim"**.
- **Medium light (~512):** serial prints **"medium"**.
- **Bright light (~768+):** serial prints **"bright"**.
- Output updates every 500 ms. One word per line.

## What this verifies

1. Range mapping: `floor of (sensorReading / 256)` converts ADC to a 0-3 integer
   — 0 at 0-255, 1 at 256-511, 2 at 512-767, 3 at 768-1023
2. Cascaded if-statements simulate switch/case
3. LDR voltage divider reading maps to descriptive labels

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
