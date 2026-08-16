# arduino-02-tone-multiple — expected behaviour

## Circuit

Arduino Uno D6, D7, D8 → three separate buzzers → GND.

## Program

Cycles through three buzzers in sequence, forever: buzzer 1 at 440 Hz for 200 ms, buzzer 2 at 523 Hz for 500 ms, buzzer 3 at 659 Hz for 300 ms.

## Observable behaviour

Each cycle (~1 second total):
1. **Buzzer on D6** sounds at **440 Hz** (A4) for 200 ms, then silent.
2. **Buzzer on D7** sounds at **523 Hz** (C5) for 500 ms, then silent.
3. **Buzzer on D8** sounds at **659 Hz** (E5) for 300 ms, then silent.
4. Cycle repeats. Only one buzzer sounds at a time.

## What this verifies

1. Multiple tone outputs on separate pins
2. Each buzzer produces a distinct pitch
3. Sequential control with explicit `turn off` between notes
