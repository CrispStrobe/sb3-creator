# morse-buzzer-message -- expected behaviour

## Circuit

- MCU P1.1 -> active buzzer -> GND (sounds while the pin is HIGH).
- VCC (5 V) -> 1 kOhm -> LED `lamp` (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

Three procedures share one time unit of 150 ms:

| procedure  | sound + light | silence after |
|------------|---------------|---------------|
| dot        | 150 ms        | 150 ms        |
| dash       | 450 ms        | 150 ms        |
| letter gap | -             | 300 ms more   |

The main loop spells H E L L O and then adds 900 ms, so the silence between
two words is 1 + 6 = 7 units (1050 ms). One pass takes 8.4 s.

## Observable behaviour

| letter | code      | buzzer and lamp pattern               |
|--------|-----------|---------------------------------------|
| H      | . . . .   | four short                            |
| E      | .         | one short                             |
| L      | . - . .   | short, long, short, short             |
| L      | . - . .   | short, long, short, short             |
| O      | - - -     | three long, then a longer pause       |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Procedures (DEFINE) used as reusable building blocks
2. Timing ratios: 1 : 3 for dot and dash, 1 / 3 / 7 units of silence
3. One output pattern driving two outputs at once

```assert
# Before the program runs both outputs are idle.
net LED_lamp.cathode V 5.00 +-0.01
net BUZZ_buzzer.a V 0.00 +-0.01
```
