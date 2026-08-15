# pc13-direct-diode — a plain diode in series with an LED

## Circuit
5 V → 220 Ω → diode (forward) → LED (green) → return. One loop, no branches.

## Expected (measured on the engine, `audit-solve pc13-direct-diode`)

| node | volts |
|---|---|
| supply / R top | 5.0000 |
| R bottom = diode anode | 2.8917 |
| diode cathode = LED anode | 2.0958 |
| return | 0.0000 |

- Diode forward drop **0.796 V**, LED forward drop **2.096 V**.
- Current **9.58 mA** = (5.0 − 2.8917) / 220.
- LED brightness **0.4792**.

The hand calculation with textbook drops — (5.0 − 0.7 − 2.0) / 220 ≈ 10.5 mA —
lands about 10 % high, and that gap is the lesson, not an error: a diode's drop
is not a constant. It rises with current (0.7 V is the number quoted at about
1 mA), so the more current you push the more voltage the diode takes back, and
the loop settles below the naive answer. Both diodes here sit above their
nominal drop.

## Try it
Delete the diode and wire R straight to the LED: current rises to about
13.6 mA and brightness to ≈ 0.65 (that circuit is `pc01-led-resistor`). The
difference is the ~0.8 V the diode was eating.
