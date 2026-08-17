# pc01-led-resistor — LED with series resistor

## Circuit
5V supply → 220Ω resistor → red LED (Vf=2.0V) → supply return.
Seated on a half breadboard.

## Expected
- I = (5.0 - 2.0) / 220 = 13.6 mA
- LED brightness ≈ 0.6522
- V across resistor = 3.0V

```assert
# Supply rail: vsource at 5.0V
net vsource_2.pos V 5.00 +-0.01
```
