# 53-servo-sweep — expected behaviour

## Circuit

MCU P1.1 (PCA CCP0) → servo signal input. Servo VCC and GND connect to
the **power rail**, NOT to the chip. The pin carries only the 50 Hz control
pulse (~µA into a high-impedance input). The servo's motor current
(hundreds of mA moving, over 1 A stalled) flows from the supply rail.

**This is the first part whose current does not come from the chip.** The
120 mA chip-budget warning must NOT fire on this circuit — the signal pin
draws microamps, not milliamps.

## Program

Sweeps a servo from 0° to 180° in 10° steps (100 ms per step), then back.
Full cycle: 3.6 seconds.

## Servo PWM signal

A standard hobby servo expects a 50 Hz PWM signal (20 ms period):
- **0°:** 1.0 ms pulse (5% duty)
- **90°:** 1.5 ms pulse (7.5% duty) — measured at 1499.6 µs
- **180°:** 2.0 ms pulse (10% duty)

The PCA compare/match module generates this from a reload value.

## Observable behaviour

| step | angle | pulse width | servo position |
|---|---|---|---|
| 1 | 10° | ~1.056 ms | near 0° |
| 9 | 90° | 1.5 ms | centre |
| 18 | 180° | 2.0 ms | full travel |
| 27 | 90° | 1.5 ms | centre (returning) |
| 36 | 0° | 1.0 ms | start (new cycle) |

## What this verifies

1. `set <name> angle to <n>` parses and round-trips through C
2. The servo takes power from the rail, signal from the pin
3. The chip-budget warning does NOT fire (signal current only)
4. The PCA driver produces the correct pulse width for the angle

```assert
# Supply rail: VCC = 5.0V
net VCC.vcc V 5.00 +-0.01
```
