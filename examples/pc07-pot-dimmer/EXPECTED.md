# pc07-pot-dimmer

## Circuit
5V → potentiometer (10kΩ) wiper → 220Ω → LED → return.

## Expected
- At 50% position: V_wiper ≈ 2.5V
- I ≈ (2.5 - 2.0) / 220 ≈ 2.3 mA (dim)
- At 100%: I = (5.0 - 2.0) / 220 = 13.6 mA (bright)

```assert
# Supply rail: 5V source
net vsource_2.pos V 5.00 +-0.01
```
