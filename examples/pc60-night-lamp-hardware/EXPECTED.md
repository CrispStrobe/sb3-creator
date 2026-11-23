# Hardware night lamp

The LDR divider biases the transistor. At low light the transistor conducts the
LED branch; at high light the branch current falls.

```assert
# LDR dark: R_LDR = rDark = 100k, R_fixed = 10k, junction = 5 × 10k/110k = 0.4545V
# NPN off: no LED current, so R drops nothing and the LED anode sits at 5 V
# (the collector between the dark LED and the off transistor is held by
# leakage alone and is not asserted)
net ldr.b V 0.45 +-0.02
net led.anode V 5.00 +-0.01
```
