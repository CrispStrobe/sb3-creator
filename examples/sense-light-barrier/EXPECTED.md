# sense-light-barrier -- expected behaviour

## Circuit

- Light sensor: VCC -> LDR -> junction -> 10 kOhm -> GND; junction -> MCU
  P1.3 (ADC). More light means less LDR resistance and a HIGHER reading.
- VCC (5 V) -> 1 kOhm -> LED `beam` -> MCU P1.0 (active-low). On a real
  build this LED points straight at the LDR across the gap to be watched.
- VCC (5 V) -> 1 kOhm -> LED `hit` -> MCU P1.1 (active-low).

## Program

1. Turns the beam on, waits 0.5 s, averages 8 readings 50 ms apart: `base`.
2. Sets the trigger `limit` to 70 % of `base` and prints it.
3. Every 20 ms: when the reading falls below `limit` while the barrier was
   clear, it counts one interruption, lights `hit` and prints the count. When
   the reading rises above `limit` again, `hit` goes off and the barrier is
   armed for the next interruption.

## Observable behaviour

| situation                     | reading vs limit | hit | count        |
|-------------------------------|------------------|-----|--------------|
| beam reaches the sensor       | above            | off | unchanged    |
| something breaks the beam     | below            | ON  | +1, printed  |
| object stays in the beam      | below            | ON  | unchanged    |
| object leaves                 | above            | off | unchanged    |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Self-calibration: a threshold derived from a measured baseline
2. Averaging several readings
3. Counting each interruption once (a two-state latch)

```assert
# No light control set: the engine holds the LDR at its dark resistance
# (1 MOhm) against the 10k leg: 5 V * 10k / 1.01M = 0.0495 V.
net LDR_ldr.b V 0.0495 +-0.005
net MCU.P1.3 V 0.0495 +-0.005
```
