# pc09-direct-led — direct wired, no breadboard

## Circuit
9V battery → 1kΩ → red LED → battery return. Point-to-point wiring.

## Expected
- I = (9.0 - 2.0) / 1000 = 7.0 mA
- LED brightness ≈ 0.3465

```assert
# 9V supply, I = (9-2)/1k = 7mA
net vsource_1.pos V 9.00 +-0.01
```
