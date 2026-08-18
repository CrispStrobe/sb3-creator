# arduino-02-tone-melody — expected behaviour

## Circuit

Arduino Uno D8 → buzzer → GND.

## Program

Plays an 8-note melody once: C4, G3, G3, A3, G3, rest, B3, C4. Each note has a specific duration.

## Observable behaviour

| step | note | frequency | duration |
|---|---|---|---|
| 1 | C4 | 262 Hz | 250 ms |
| 2 | G3 | 196 Hz | 125 ms |
| 3 | G3 | 196 Hz | 125 ms |
| 4 | A3 | 220 Hz | 250 ms |
| 5 | G3 | 196 Hz | 250 ms |
| 6 | rest | silent | 250 ms |
| 7 | B3 | 247 Hz | 250 ms |
| 8 | C4 | 262 Hz | 250 ms |

Total duration: ~1.75 seconds. The melody plays once and the buzzer goes silent.

## What this verifies

1. Tone frequency control: different Hz values produce distinct pitches
2. Timing: each `wait` sets the note duration
3. Rest: `turn off speaker` creates a silent gap in the melody

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
