# pc10-direct-series

## Circuit
9V → 470Ω → red LED → green LED → return. Two LEDs in series.

## Expected
- I = (9.0 - 2.0 - 2.0) / 470 ≈ 10.6 mA
- Both LEDs lit at similar brightness

```assert
# 9V, two LEDs in series: I = (9-2-2)/470 = 10.6mA
net vsource_1.pos V 9.00 +-0.01
current led_3 mA -10.6 +-1.5
current led_4 mA -10.6 +-1.5
```
