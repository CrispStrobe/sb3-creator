# 39-zener-clamp -- expected behaviour

## Circuit

VCC (9 V) -> R1 (330 Ohm) -> junction.
Junction -> zener (Vz = 5.1 V, reverse-biased) -> GND (clamp path).
Junction -> R2 (1 kOhm) -> green LED (Vf = 2.0 V) -> GND (load path).

No MCU -- zener regulates the junction voltage.

## Observable behaviour

- **Junction voltage:** clamped to 5.1 V by the zener
- **LED branch current:** (5.1 - 2.0) / 1000 = 3.1 mA
- **Voltage across R2:** 3.1 V
- **Total current through R1:** (9.0 - 5.1) / 330 = 11.8 mA
- **Zener current:** 11.8 - 3.1 = 8.7 mA (absorbs excess)
- **Power in zener:** 5.1 V x 8.7 mA = 44.4 mW
- **LED state:** always ON, regulated brightness

## What this verifies

1. Zener diode clamps voltage at its breakdown voltage
2. Load sees regulated voltage regardless of supply
3. Series resistor R1 must absorb (V_supply - V_zener); without it the zener would burn
