# sense-noise-counter -- expected behaviour

## Circuit

- Sound module: VCC and GND from the rails, digital output `do` -> MCU P3.2
  (driven by the module, no pull-up).
- VCC (5 V) -> 1 kOhm -> LED `blip` (Vf = 2.0 V) -> MCU P1.0 (active-low).
- VCC (5 V) -> 1 kOhm -> LED `warn` (Vf = 2.0 V) -> MCU P1.1 (active-low).

## Program

Each window is 1000 samples, one every 10 ms, so about 10 s. A noise is
counted when `do` is HIGH now and was LOW at the previous sample (a rising
edge); `blip` is lit for that one sample. At the end of the window the count
is printed and `warn` is lit if it was 5 or more, otherwise cleared.

## Observable behaviour

| during a window                  | blip            | after the window          |
|----------------------------------|-----------------|---------------------------|
| silence                          | off             | prints 0, warn off        |
| 3 separate claps                 | 3 short flashes | prints 3, warn off        |
| 6 separate claps                 | 6 short flashes | prints 6, warn ON         |
| one noise held for 2 s           | 1 short flash   | prints 1                  |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Rising-edge detection with a remembered previous sample
2. Counting events in a fixed time window
3. A threshold on a count rather than on a voltage

```assert
net SOUND_noise.do V 0.00 +-0.01
net MCU.P3.2 V 0.00 +-0.01
```
