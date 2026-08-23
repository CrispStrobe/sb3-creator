# arduino-04-read-ascii-string — expected behaviour

## Circuit

Arduino Uno A0, A1, A2 <- wipers of three 10 kohm pots (VCC to GND). D3, D5, D6 (PWM) → 220 ohm each → RGB LED → GND.

## Program

Reads three pots and maps each to a 0-100 percent PWM duty on the red, green, and blue channels of an RGB LED. Updates every 50 ms.

## Observable behaviour

- **All pots at zero:** RGB LED is OFF (black).
- **Pot R up, others zero:** LED is **red**.
- **Pot G up, others zero:** LED is **green**.
- **Pot B up, others zero:** LED is **blue**.
- **All pots up:** LED is **white**.
- Mixing produces any colour: R+G = yellow, R+B = magenta, G+B = cyan.

## What this verifies

1. Three independent analog-to-PWM channels
2. RGB LED colour mixing through independent PWM control
3. Adapted from serial-input original — pots replace parsed ASCII strings

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net potR.wiper V 2.50 +-0.05
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net potG.wiper V 2.50 +-0.05
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net potB.wiper V 2.50 +-0.05
```
