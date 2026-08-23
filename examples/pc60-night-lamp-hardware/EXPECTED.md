# Hardware night lamp

The LDR divider biases the transistor. At low light the transistor conducts the
LED branch; at high light the branch current falls.

```assert
# LDR dark: R_LDR = rDark = 100k, R_fixed = 10k, junction = 5 × 10k/110k = 0.4545V
# NPN off: collector floats at ~3V (LED reverse voltage)
net ldr.b V 0.45 +-0.02
net led.cathode V 3.00 +-0.50
```
