# NAND test

Try all four switch combinations. The indicator is off only when both inputs
are high, making the truth table visible without a microcontroller.

```assert
# NAND: both inputs low -> output HIGH -> LED on
net vcc.pos V 5.00 +-0.01
```
