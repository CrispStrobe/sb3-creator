# pc72-tagschaltung — expected behaviour

## Circuit
VCC → LDR → junction → 10 kΩ → GND. Junction → NPN base. VCC → 470 Ω → white LED → NPN collector. NPN emitter → GND.

## Observable behaviour
- **Bright (LDR ≈ 1 kΩ):** V_base = 5 × 10k/(1k+10k) = 4.55 V. Transistor ON. LED ON.
  I_LED ≈ (5 − 2 − 0.2) / 470 ≈ 5.96 mA.
- **Dark (LDR ≈ 100 kΩ):** V_base = 5 × 10k/(100k+10k) = 0.45 V. Below 0.7 V threshold. Transistor OFF. LED OFF.
- The LED follows the light — bright environment → LED on.

## What this verifies
1. LDR + resistor voltage divider controls transistor base
2. NPN switches LED based on light level
3. Divider ratio determines the light threshold

```assert
# Day circuit: LDR upper, R lower. Bright -> base HIGH -> LED on
net vcc_1.pos V 5.00 +-0.01
```
