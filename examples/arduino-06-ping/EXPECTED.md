# arduino-06-ping — expected behaviour

## Circuit

Arduino Uno D7 (trigger output), D8 (echo input) → ultrasonic distance sensor. VCC = 5 V.

## Program

Sends a trigger pulse on D7 (2 us low, 10 us high), then reads echo on D8. Prints the reading to serial every 100 ms.

## Observable behaviour

- **Serial monitor** prints distance readings every 100 ms.
- The ultrasonic sensor returns a value proportional to distance.
- In simulation, the echo value depends on the simulated sensor state.

## What this verifies

1. Trigger pulse generation: precise microsecond timing on D7
2. Echo reading on D8 after the trigger
3. Continuous distance monitoring via serial output

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
