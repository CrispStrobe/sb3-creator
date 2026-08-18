# arduino-sk-p04-color-mixing — expected behaviour

## Circuit

Arduino Uno A0, A1, A2 <- wipers of three 10 kohm pots. D3, D5, D6 (PWM) → 220 ohm each → RGB LED channels → GND.

## Program

Reads three pots and maps each (0-1023) to a PWM value (0-255) for the red, green, and blue channels. Updates every 50 ms.

## Observable behaviour

- **All pots at zero:** RGB LED is OFF (black).
- **Pot 1 up only:** LED glows **red**.
- **Pot 2 up only:** LED glows **green**.
- **Pot 3 up only:** LED glows **blue**.
- **Mix:** R+G = yellow, R+B = magenta, G+B = cyan, all = white.
- Smooth colour transitions as pots are turned.

## What this verifies

1. Three-channel PWM colour mixing
2. Independent analog-to-PWM mapping per channel
3. Real-time colour blending from three analog inputs

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
# Pot at 50%: wiper = 5.0 × 0.5 = 2.500V
net pot1.wiper V 2.50 +-0.05
```
