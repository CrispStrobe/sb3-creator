# pc88-lichtorgel — expected behaviour

## Circuit
Sound module (AO output) → 3 NPN transistor stages. Base resistors: 10 kΩ (red), 22 kΩ (green), 47 kΩ (blue). Each collector drives 2 LEDs through 470 Ω.

## Observable behaviour
- **Sound level 0 (silent):** all LEDs off. V_base < 0.7 V for all stages.
- **Low level (~30%):** AO ≈ 1.5 V. Through 10 kΩ: I_base ≈ 80 µA → red LEDs ON.
  Through 22 kΩ: I_base ≈ 36 µA → marginal. Through 47 kΩ: I_base ≈ 17 µA → off.
- **Medium level (~60%):** AO ≈ 3 V. Red ON (150 µA base). Green ON (105 µA). Blue marginal.
- **High level (~90%):** AO ≈ 4.5 V. All three stages saturated. All 6 LEDs ON.
- **LED current per pair:** (5 − 2 − 0.2) / 470 ≈ 5.96 mA each.

## What this verifies
1. Different base resistors create different sensitivity thresholds
2. Sound module AO provides analog level proportional to sound
3. Three-band qualitative level display (not frequency separation)

```assert
# Sound-driven 3-stage NPN: thresholds at 10k/22k/47k base resistors
# TODO: needs engine model for sound module analog output
net vcc_1.pos V 5.00 +-0.01
```
