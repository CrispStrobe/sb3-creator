# 22-series-parallel -- expected behaviour

## Circuit

Two branches from VCC (5 V) to GND, no MCU:

**Series branch:** VCC -> R1 (470 Ohm) -> R2 (470 Ohm) -> red LED (Vf = 2.0 V) -> GND.
**Parallel branch:** Two independent paths, each VCC -> 470 Ohm -> green LED (Vf = 2.0 V) -> GND.

## Observable behaviour

### Series branch (R1 + R2 + LED1)
- **Total resistance:** 470 + 470 = 940 Ohm
- **Current:** (5.0 - 2.0) / 940 = 3.19 mA
- **Voltage across each resistor:** 3.19 mA x 470 = 1.50 V
- **LED1 brightness:** dim (3.19 mA)

### Parallel branch (each path independent)
- **Resistance per path:** 470 Ohm
- **Current per LED:** (5.0 - 2.0) / 470 = 6.38 mA
- **Total parallel branch current:** 2 x 6.38 = 12.77 mA
- **LED2 brightness:** bright (6.38 mA)
- **LED3 brightness:** bright (6.38 mA)

### Comparison

| property                  | series branch | each parallel path |
|---------------------------|---------------|-------------------|
| resistance                | 940 Ohm       | 470 Ohm           |
| current                   | 3.19 mA       | 6.38 mA           |
| LED brightness            | dim           | bright            |
| power from supply         | 16.0 mW      | 31.9 mW each      |

- **Series resistors double the resistance, halving current**
- **Parallel paths each carry independent current**
- **Total supply current:** 3.19 + 12.77 = 15.96 mA

## What this verifies

1. Series resistance adds: R_total = R1 + R2
2. Parallel paths share voltage, not current
3. Visual brightness comparison shows current difference
