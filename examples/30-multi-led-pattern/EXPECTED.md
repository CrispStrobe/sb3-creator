# 30-multi-led-pattern -- expected behaviour

## Circuit

4 LEDs wired active-low, each with its own 1 kOhm current-limiting resistor:

- VCC (5 V) -> 1 kOhm -> red LED (Vf = 2.0 V) -> MCU P1.0
- VCC (5 V) -> 1 kOhm -> green LED (Vf = 2.0 V) -> MCU P1.1
- VCC (5 V) -> 1 kOhm -> yellow LED (Vf = 2.0 V) -> MCU P1.2
- VCC (5 V) -> 1 kOhm -> blue LED (Vf = 2.0 V) -> MCU P1.3

## Program

Lights each LED for 200 ms in sequence (1 -> 2 -> 3 -> 4), then repeats,
creating a chaser/knight-rider effect.

## Observable behaviour

| time (ms) | P1.0 | P1.1 | P1.2 | P1.3 | LED on    |
|-----------|------|------|------|------|-----------|
| 0         | LOW  | HIGH | HIGH | HIGH | red       |
| 200       | HIGH | LOW  | HIGH | HIGH | green     |
| 400       | HIGH | HIGH | LOW  | HIGH | yellow    |
| 600       | HIGH | HIGH | HIGH | LOW  | blue      |
| 800       | LOW  | HIGH | HIGH | HIGH | red       |

- **Sequence period:** 4 x 200 ms = 800 ms
- **Frequency:** 1.25 Hz full cycle
- **LED current (each, when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Only one LED is on at a time** (max current draw = 3.0 mA)

## What this verifies

1. Multiple active-low LED outputs on consecutive port pins
2. Sequential on/off pattern with precise timing
3. Only one LED active at any moment (no overlap)
4. FOREVER loop for continuous animation

```assert
# MCU supply: VCC = 5.000V (4 LEDs on port)
net MCU.VCC V 5.00 +-0.01
```
