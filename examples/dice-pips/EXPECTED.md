# dice-pips -- expected behaviour

## Circuit

- Button `btn` on P3.2 with a 10 kOhm pull-up to VCC; pressing connects the
  pin to GND (active-low).
- Seven LEDs in the pattern of a die face, each VCC (5 V) -> 1 kOhm -> LED ->
  MCU pin (active-low):

      tl (P1.0)            tr (P1.1)
      ml (P1.2)  mid (P1.3) mr (P1.4)
      bl (P1.5)            br (P1.6)

## Program

1. While the button is held, `seed` counts 1..250 once per millisecond, so
   where it stops depends on how long the press lasted.
2. On release the die rolls 10 times. Each roll applies
   `seed = seed x 11 mod 251` and shows face `floor(seed x 6 / 251) + 1`,
   i.e. which sixth of 1..250 the seed lies in. The pause
   after each roll starts at 50 ms and grows by 30 ms, so the roll slows down
   (50 + 80 + ... + 320 ms = 1850 ms in total).
3. The last face stays lit and is printed.

## Observable behaviour

| face | LEDs on                          |
|------|----------------------------------|
| 1    | mid                              |
| 2    | tl, br                           |
| 3    | tl, mid, br                      |
| 4    | tl, tr, bl, br                   |
| 5    | tl, tr, mid, bl, br              |
| 6    | tl, tr, ml, mr, bl, br           |

- **LED current (each, when on):** (5.0 - 2.0) / 1000 = 3.0 mA
- **Face 6:** 6 x 3.0 = 18.0 mA

## What this verifies

1. A procedure that maps a number to a pattern with shared conditions
2. A pseudo-random generator built from integer arithmetic only
3. Seeding from human timing

```assert
net R_PU_btn.b V 5.00 +-0.01
net LED_mid.cathode V 5.00 +-0.01
```
