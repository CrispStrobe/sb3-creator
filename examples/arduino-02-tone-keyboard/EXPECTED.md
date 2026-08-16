# arduino-02-tone-keyboard — expected behaviour

## Circuit

Arduino Uno A0, A1 <- wipers of two 10 kohm pots (VCC to GND). D8 → buzzer → GND.

## Program

Reads two analog sensors. If sensor1 (A0) exceeds 10, plays 440 Hz. Otherwise if sensor2 (A1) exceeds 10, plays 494 Hz. If neither exceeds threshold, buzzer is silent.

## Observable behaviour

- **Both pots at zero:** buzzer is **silent**.
- **Pot 1 turned up (A0 > 10):** buzzer plays **440 Hz** (A4).
- **Pot 1 at zero, pot 2 turned up:** buzzer plays **494 Hz** (B4).
- **Both pots up:** pot 1 takes priority — plays 440 Hz.

## What this verifies

1. Analog threshold detection on two channels
2. Priority-based tone selection (sensor1 checked first)
3. `set tone speaker to` and `turn off speaker` control buzzer pitch
