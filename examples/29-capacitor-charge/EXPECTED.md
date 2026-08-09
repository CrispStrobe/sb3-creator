# 29-capacitor-charge -- expected behaviour

## Circuit

VCC (5 V) -> 10 kOhm resistor -> 100 uF capacitor -> GND.
No MCU -- pure passive RC charging circuit.

## Expected time constant

- **R:** 10 kOhm = 10000 Ohm
- **C:** 100 uF = 0.0001 F
- **Time constant (tau):** R x C = 10000 x 0.0001 = 1.0 s

## Observable behaviour

The capacitor charges exponentially toward VCC:

| time (s) | time / tau | V_cap (V) | % of VCC |
|----------|-----------|-----------|----------|
| 0.0      | 0         | 0.00      | 0%       |
| 1.0      | 1 tau     | 3.16      | 63.2%    |
| 2.0      | 2 tau     | 4.32      | 86.5%    |
| 3.0      | 3 tau     | 4.75      | 95.0%    |
| 4.0      | 4 tau     | 4.91      | 98.2%    |
| 5.0      | 5 tau     | 4.97      | 99.3%    |

- **Charging formula:** V_cap(t) = VCC x (1 - e^(-t/tau))
- **Current formula:** I(t) = (VCC / R) x e^(-t/tau)
- **Initial current:** 5.0 / 10000 = 0.5 mA
- **Practically fully charged:** ~5 tau = 5.0 s

## What this verifies

1. RC time constant: tau = R x C
2. Exponential charging curve toward supply voltage
3. Current decreases as capacitor voltage rises
4. After 5 tau the capacitor is effectively fully charged
