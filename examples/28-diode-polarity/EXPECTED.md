# 28-diode-polarity -- expected behaviour

## Circuit

Two parallel paths from VCC (5 V) to GND:

- **Path A (forward):** VCC -> 470 Ohm resistor -> diode (Vf = 0.7 V, forward-biased) -> green LED (Vf = 2.0 V) -> GND
- **Path B (reverse):** VCC -> 470 Ohm resistor -> diode (Vf = 0.7 V, reverse-biased) -> red LED (Vf = 2.0 V) -> GND

No MCU -- pure passive circuit demonstrating diode polarity.

## Observable behaviour

### Path A -- forward-biased diode
- **Current:** (5.0 - 0.7 - 2.0) / 470 = 4.9 mA
- **Voltage across resistor:** 4.9 mA x 470 = 2.3 V
- **Voltage across diode:** 0.7 V
- **Voltage across LED:** 2.0 V
- **Green LED state:** ON

### Path B -- reverse-biased diode
- **Current:** 0 mA (diode blocks)
- **Red LED state:** OFF

## What this verifies

1. Diode polarity: forward-biased conducts, reverse-biased blocks
2. Series voltage drops: VCC = V_R + V_diode + V_LED
3. A reverse-biased diode effectively opens the circuit
4. Visual comparison: one LED lights, the other stays dark
