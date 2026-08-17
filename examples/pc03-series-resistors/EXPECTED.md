# pc03-series-resistors

## Circuit
5V → R1 (1kΩ) → R2 (2kΩ) → green LED (Vf=2.0V) → return.

## Expected
- R total = 3kΩ, I = (5.0 - 2.0) / 3000 = 1.0 mA
- V across R1 = 1.0V, V across R2 = 2.0V

```assert
# Series R: 5V - 2.0V(LED) across 1k+2k = 1.0mA; V at R1.b = 5-1.0 = 4.0V
net vsource_2.pos V 5.00 +-0.01
net resistor_3.b V 4.00 +-0.15
```
