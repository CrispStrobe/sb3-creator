# Expected behavior: ttl-clock-module

The 555 astable oscillates. The LED blinks at a rate controlled by the
potentiometer. The simulation engine solves the RC timing and the 555's
internal comparator thresholds. The manual step button injects a single
pulse when pressed.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
