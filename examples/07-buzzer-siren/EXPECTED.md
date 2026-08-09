# 07-buzzer-siren — expected behaviour

## Circuit

VCC → buzzer → MCU P1.5 (TONE pin). Timer 1 generates the square wave;
the frequency is set by the `tone` command.

## Program

Alternates between 440 Hz (A4) and 880 Hz (A5) every 500 ms, forever.

## Observable behaviour

| time | frequency | note | period |
|---|---|---|---|
| 0 ms | 440 Hz | A4 | 2.273 ms |
| 500 ms | 880 Hz | A5 | 1.136 ms |
| 1000 ms | 440 Hz | A4 | 2.273 ms |

- Timer 1 reload for 440 Hz at FOSC 11059200: 65536 − (11059200 / 12 / 880) ≈ 64489
  (Timer 1 at FOSC/12, mode 1; the frequency is halved because the output toggles)
- Timer 1 reload for 880 Hz: 65536 − (11059200 / 12 / 1760) ≈ 65012

## What this verifies

1. TONE pin declaration and `tone` command
2. Timer 1 frequency generation (independent from Timer 0 ms tick)
3. Frequency changes mid-program
4. The buzzer is wired between VCC and the pin (current flows when pin is LOW)
