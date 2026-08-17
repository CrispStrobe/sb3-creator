# pc84-led-herz — expected behaviour

## Circuit
LM358 dual op-amp. Op1: integrator (R=100 kΩ, C=1 µF). Op2: comparator with hysteresis (100 kΩ/47 kΩ). Bias at VCC/2. 5 red LEDs on triangle output through 470 Ω each.

## Observable behaviour
- **Triangle wave** on op1 output: ramps between ~1.5 V and ~3.5 V around VCC/2.
- **Breathing period:** approximately 2 × R × C × (V_hyst/V_swing) ≈ 0.5–2 s.
- **LED current at peak:** (3.5 − 2) / 470 ≈ 3.2 mA per LED, 16 mA total.
- **LED current at trough:** ~0 mA (triangle below Vf).
- Five LEDs pulse in sync — all driven from the same triangle.

## What this verifies
1. Integrator + comparator = triangle-wave oscillator
2. Analog dimming via triangle waveform (not PWM)
3. LM358 dual op-amp used as two functional blocks

```assert
# LM358 triangle oscillator: VCC = 5V, triangle swings around VCC/2
# TODO: needs engine model for dual opamp integrator/comparator interaction
net vcc_1.pos V 5.00 +-0.01
```
