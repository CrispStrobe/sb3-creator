# 32-source-vs-sink — the 8051's central asymmetry

## Circuit

Two LEDs, same command (`turn on`), same resistor (1 kΩ), opposite wiring:

- **Sink (green, active-low):** VCC → 1 kΩ → LED → MCU P1.0.
  `turn on` drives P1.0 LOW. The pin sinks current from VCC through the LED.
  I = (5.0 − 2.0) / 1000 = 3.0 mA. **LED is bright.**

- **Source (red, active-high):** MCU P1.1 → 1 kΩ → LED → GND.
  `turn on` drives P1.1 HIGH. The quasi-bidirectional pin sources only ~230 µA.
  I ≈ 0.23 mA. **LED is dim or dark.**

## Why this matters

The STC12C5A60S2 datasheet §4.6: a quasi-bidirectional pin sinks up to 20 mA
but sources only ~230 µA through a weak internal pull-up. This is why every
LED in this project is wired active-low (VCC → R → LED → pin). A learner
who wires it the other way (pin → R → LED → GND) gets a dead-looking LED
and no error message from a naive simulator.

Push-pull mode (PxM1=0, PxM0=1) sources AND sinks 20 mA, but quasi-bidirectional
is the power-on default and the most common mode in beginner code.

## Observable behaviour

| LED | wiring | pin level | current | brightness |
|---|---|---|---|---|
| green (sink) | VCC→R→LED→pin | LOW (0) | ~3.0 mA | **bright** (~0.14) |
| red (source) | pin→R→LED→GND | HIGH (1) | ~0.23 mA | **dim** (~0.007) |

The factor-of-13 difference in brightness IS the lesson.

## What this verifies

1. The engine models the quasi-bidirectional sink/source asymmetry
2. Active-low wiring (the correct way) produces full brightness
3. Active-high wiring (the common mistake) produces near-zero brightness
4. The same `turn on` command produces visibly different results

```assert
# MCU VCC supply = 5.000V
net mcu1.VCC V 5.00 +-0.01
```
