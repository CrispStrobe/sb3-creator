# 43-rc-timing -- expected behaviour

## Circuit

VCC (5 V) -> R (10 kOhm) -> capacitor (100 uF) -> GND.
No MCU -- pure RC charging circuit.

## Observable behaviour

- **Time constant:** tau = R x C = 10000 x 0.0001 = 1.0 s
- **Voltage across capacitor:** V_c(t) = 5.0 x (1 - e^(-t/tau))

### Voltage at key times

| Time (s) | t/tau | V_cap (V) | % of VCC |
|----------|-------|-----------|----------|
| 0.0      | 0.0   | 0.00      | 0%       |
| 1.0      | 1.0   | 3.16      | 63.2%    |
| 2.0      | 2.0   | 4.32      | 86.5%    |
| 3.0      | 3.0   | 4.75      | 95.0%    |
| 5.0      | 5.0   | 4.97      | 99.3%    |

- **Charging current:** I(t) = (5.0 / 10000) x e^(-t/tau), starts at 0.5 mA, decays exponentially
- **Practically fully charged after 5 tau = 5.0 s**

## What this verifies

1. RC time constant formula: tau = R x C
2. Exponential charging curve V_c = V_cc x (1 - e^(-t/tau))
3. Capacitor reaches ~63% of supply in one time constant
