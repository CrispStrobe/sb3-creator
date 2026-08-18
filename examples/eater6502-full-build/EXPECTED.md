# Expected behavior: eater6502-full-build

The program compiles and runs without errors. The 8 LEDs on VIA port A
count in binary from 0 to 255, wrapping around. Serial output prints
the counter value each step.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net contrast.wiper V 2.50 +-0.05
```
