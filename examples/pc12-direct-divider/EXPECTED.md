# pc12-direct-divider

## Circuit
9V → R1 (10kΩ) → R2 (10kΩ) → return. Direct wired voltage divider.

## Expected
- V at junction = 4.5V
- I = 0.45 mA

```assert
# 9V divider: two equal 10k, junction = 4.5V
net resistor_2.b V 4.50 +-0.01
```
