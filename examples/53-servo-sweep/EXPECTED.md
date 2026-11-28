# 53-servo-sweep — expected behaviour

## Circuit

The servo’s signal wire connects to the pin used by the target’s generated firmware.
Servo VCC and GND connect to the supply rail. The signal pin carries a 50 Hz
control pulse into a high-impedance input.

| Target | Servo signal pin |
|---|---|
| STC12 and STC15 | P1.3 |
| Uno, Nano and ATmega168P | D9 |
| Arduino Mega | D11 |
| Raspberry Pi Pico | GP16 |

**This is the first part whose current does not come from the chip.** The
120 mA chip-budget warning must NOT fire on this circuit — the signal pin
draws microamps, not milliamps.

## Program

Sweeps a servo from 0° to 180° in 10° steps (100 ms per step), then back.
Full cycle: 3.6 seconds.

## Servo PWM signal

The lesson’s servo model and generated drivers use a 20 ms frame
(50 Hz) with these calibrated endpoints:

- **0°:** 0.5 ms (2.5% duty)
- **90°:** 1.5 ms (7.5% duty)
- **180°:** 2.5 ms (12.5% duty)

Check the pulse limits of a physical servo before using the full sweep.

## Observable behaviour

| step | angle | pulse width | servo position |
|---|---|---|---|
| 1 | 10° | ~0.611 ms | near 0° |
| 9 | 90° | 1.5 ms | centre |
| 18 | 180° | 2.5 ms | full travel |
| 27 | 90° | 1.5 ms | centre (returning) |
| 36 | 0° | 0.5 ms | start (new cycle) |

## What this verifies

1. `set <name> angle to <n>` parses and round-trips through C
2. The servo takes power from the rail, signal from the pin
3. The chip-budget warning does NOT fire (signal current only)
4. The servo model decodes 50 Hz pulses on the wired pin and reaches full travel

```assert
# Supply rail: VCC = 5.0V
net VCC.vcc V 5.00 +-0.01
```
