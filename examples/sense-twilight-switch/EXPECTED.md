# sense-twilight-switch -- expected behaviour

## Circuit

- Light sensor: VCC -> LDR -> junction -> 10 kOhm -> GND; junction -> MCU
  P1.3 (ADC). More light means a higher reading.
- VCC (5 V) -> 1 kOhm -> LED `lamp` (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

The lamp is switched off at start. Every 100 ms the reading is compared with the limit that would CHANGE the
current state: below 300 while the lamp is off, above 500 while it is on.
Each reading past that limit adds one to `steady`; any reading that is not
resets it to 0. When `steady` reaches 8 (0.8 s in a row) the lamp switches and
the change is printed (`dusk: lamp on` / `dawn: lamp off`).

A 12-bit ADC (Pico, STM32F030) reads 0..4095 instead of 0..1023, so the
same input gives a larger number and these raw thresholds are crossed at a
lower level than on a 10-bit board. The program works on every board; only
the switching point moves.

## Observable behaviour

| light reading              | lamp off                   | lamp on                    |
|----------------------------|----------------------------|----------------------------|
| below 300 for 0.8 s        | switches ON                | stays on                   |
| between 300 and 500        | stays off                  | stays on                   |
| above 500 for 0.8 s        | stays off                  | switches OFF               |
| past a limit for 0.5 s     | no change                  | no change                  |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Confirmation time:** 8 x 100 ms = 0.8 s

## What this verifies

1. Hysteresis: separate switch-on and switch-off thresholds
2. Time qualification: a condition must hold continuously before acting
3. A small state machine with a state variable

```assert
# No light control set: LDR at its dark resistance, 5 V * 10k / 1.01M.
net LDR_ldr.b V 0.0495 +-0.005
net MCU.P1.3 V 0.0495 +-0.005
```
