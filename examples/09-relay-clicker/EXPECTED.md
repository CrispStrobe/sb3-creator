# 09-relay-clicker — expected behaviour

## Circuit

- VCC → relay coil (70 Ω, 3.5 V pickup) → MCU P1.0 (output, active-high).
  When P1.0 goes HIGH, current flows through the coil and the relay energises.
- VCC → 1 kΩ → green LED → MCU P1.1 (active-low). Mirrors the relay state.

Note: a real circuit would include a flyback diode across the relay coil.
The simulator models the relay as a resistive coil with a threshold.

## Program

Toggles the relay and LED every 2 seconds, forever.

## Observable behaviour

| time (s) | P1.0 | relay | P1.1 (active-low) | LED |
|---|---|---|---|---|
| 0 | HIGH (1) | energised | LOW (0) | ON |
| 2 | LOW (0) | de-energised | HIGH (1) | OFF |
| 4 | HIGH (1) | energised | LOW (0) | ON |

- **Relay coil current (when on):** (5.0 − 0) / 70 ≈ 71 mA (exceeds the 8051's
  quasi-bidirectional source current — a real board would need a transistor driver.
  The circuit is pedagogically simplified.)
- **LED current:** (5.0 − 2.0) / 1000 = 3.0 mA

## What this verifies

1. Relay as a circuit-only part (no dedicated pseudocode — driven via pin output)
2. Two outputs synchronised (relay + indicator LED)
3. The relay device model in the engine (coilR, vOn threshold)
