# idea-generator -- expected behaviour

## Circuit

- Key `next` on P3.2 with a 10 kOhm pull-up to VCC; pressing connects the pin
  to GND (active-low).
- VCC (5 V) -> 1 kOhm -> LED `lamp` (Vf = 2.0 V) -> MCU P1.0 (active-low).

## Program

1. Prints `press the key for an idea`.
2. While the key is not pressed, `seed` counts 1..250, one step per
   millisecond.
3. On a press: the lamp lights and three words are printed, one per line.
   Each word is chosen by `seed = seed x 11 mod 251`,
   `pick = floor(seed x 4 / 251) + 1` from its own list of four:

   | pick | first   | second     | third |
   |------|---------|------------|-------|
   | 1    | build   | a tiny     | robot |
   | 2    | paint   | a blinking | alarm |
   | 3    | program | a noisy    | game  |
   | 4    | invent  | a secret   | lamp  |

4. After the release the lamp goes off and the program waits for the next
   press.

## Observable behaviour

| action         | lamp | serial monitor                         |
|----------------|------|----------------------------------------|
| start          | off  | `press the key for an idea`            |
| press          | ON   | three lines, e.g. `invent` / `a noisy` / `game` |
| release        | off  | (nothing new)                          |

- **Possible ideas:** 4 x 4 x 4 = 64
- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Seeding a pseudo-random generator from human timing
2. Choosing from several lists with one shared generator
3. Text output to the serial monitor

```assert
net R_PU_next.b V 5.00 +-0.01
net LED_lamp.cathode V 5.00 +-0.01
```
