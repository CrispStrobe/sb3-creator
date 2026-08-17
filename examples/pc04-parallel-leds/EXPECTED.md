# pc04-parallel-leds

## Circuit
5V → two parallel paths: each 1kΩ → LED → return.

## Expected
- Each LED: I = (5.0 - 2.0) / 1000 = 3.0 mA
- Total: 6.0 mA, brightness ≈ 0.1485 each

```assert
# Supply rail: vsource at 5.0V, two equal LED branches
net vsource_2.pos V 5.00 +-0.01
```
