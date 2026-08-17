# XOR selector

The indicator is on for 01 and 10, but off for 00 and 11. This is useful for
showing “different” rather than “both” or “either.”

```assert
# XOR: both inputs low -> output LOW -> LED off
net vcc.pos V 5.00 +-0.01
```
