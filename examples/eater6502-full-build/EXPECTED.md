# Expected behavior: eater6502-full-build

The program compiles and runs without errors. Serial output counts from 0 to
255 and wraps around. PORTA is reserved for the keyboard interface; this smoke
program does not pretend that the removed, unwired bar graph exists.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net contrast.wiper V 2.50 +-0.05
```

## Peripheral wiring

The LCD is genuinely in four-bit mode: PB4–PB7 carry D4–D7 and PB0–PB2 carry
RS/RW/E. That leaves all of PORTA for the simulator's PS/2 interface model:
PA0–PA7 carry its latched scan-code byte and CA1 carries data-available. The
old decorative bar graph was removed instead of claiming the same pins twice.
