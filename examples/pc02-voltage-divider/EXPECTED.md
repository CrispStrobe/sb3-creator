# pc02-voltage-divider

## Circuit
9V battery → R1 (10kΩ) → junction → R2 (10kΩ) → battery return.

## Expected
- V at junction = 9 × 10k/(10k+10k) = 4.5V
- I = 9 / 20000 = 0.45 mA

```assert
# Supply rail: 9V battery source
net vsource_2.pos V 9.00 +-0.01
```
