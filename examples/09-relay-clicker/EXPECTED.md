# 09-relay-clicker — expected behaviour

## Circuit

MCU P1.0 → 1 kΩ base resistor → TIP120 Darlington base. TIP120 collector → relay
coil (70 Ω, 3.5 V pickup) → VCC. TIP120 emitter → GND. Flyback diode (cathode → VCC,
anode → collector) protects against inductive kick when the relay de-energises.

Indicator: VCC → 1 kΩ → green LED → MCU P1.1 (active-low).

**Why the TIP120:** The quasi-bidirectional 8051 pin sources only ~230 µA — far too
little for a relay coil that needs (5.0 V / 70 Ω) ≈ 71 mA. The TIP120 Darlington
(beta ≈ 1000) amplifies the pin's current: ~3 mA base current drives ~71 mA through
the coil. Wiring the relay straight to the pin is the single commonest beginner
mistake on this part family.

## Program

Toggles the relay and indicator LED every 2 seconds, forever.

## Observable behaviour

| time (s) | P1.0 | TIP120 | relay | P1.1 (active-low) | LED |
|---|---|---|---|---|---|
| 0 | HIGH (1) | on | energised | LOW (0) | ON |
| 2 | LOW (0) | off | de-energised | HIGH (1) | OFF |
| 4 | HIGH (1) | on | energised | LOW (0) | ON |

- **Base current:** (5.0 − 1.4) / 1000 ≈ 3.6 mA (TIP120 Vbe ≈ 1.4 V)
- **Collector current:** (5.0 − 2.0) / 70 ≈ 43 mA (Vce_sat ≈ 2 V)
- **LED current:** (5.0 − 2.0) / 1000 = 3.0 mA

## What this verifies

1. TIP120 Darlington as a driver: pin → base resistor → transistor → load
2. Flyback diode protects against inductive kick
3. The quasi-bidirectional pin limitation is respected, not worked around
4. **Negative property:** driving the relay straight from the pin does NOT energise it
