# Hardware night lamp

The LDR divider biases the transistor. At low light the transistor conducts the
LED branch; at high light the branch current falls.

```assert
# LDR dark: R_LDR >> R_fixed, junction ≈ 5 × 10k/110k ≈ 0.05V
# NPN off: collector floats at ~3V (LED reverse voltage)
net ldr.b V 0.05 +-0.10
net led.cathode V 3.00 +-0.50
```
