# reaction-duel -- expected behaviour

## Circuit

- Buttons `keyA` (P3.2) and `keyB` (P3.3), each with a 10 kOhm pull-up to
  VCC; pressing connects the pin to GND (active-low).
- LEDs `go` (P1.0), `ledA` (P1.1) and `ledB` (P1.2), each VCC (5 V) ->
  1 kOhm -> LED -> MCU pin (active-low).

## Program

1. All LEDs off; wait until both keys are released.
2. Random wait: `seed = seed x 11 mod 251`, then
   `ticks = 200 + floor(seed x 300 / 251)`, i.e. 200..498 ticks of
   10 ms, so the wait is 2.0 to 5.0 s. During the wait any press is a false
   start: player A
   pressing gives the round to B and vice versa (the winner's LED flashes 5
   times, 150 ms on / 150 ms off).
3. Otherwise `go` lights and `t` counts 1 ms steps until a key is pressed.
   `go` goes out, `t` is printed and the player who pressed first gets the
   flashes. `t` is mixed into the seed for the next round.
4. A 1 s pause, then the next round.

## Observable behaviour

| what happens                 | go  | flashes       | serial          |
|------------------------------|-----|---------------|-----------------|
| A presses before go          | off | ledB x5       | `false start A` |
| B presses before go          | off | ledA x5       | `false start B` |
| go, then A presses first     | ON, then off | ledA x5 | reaction in ms |
| go, then B presses first     | ON, then off | ledB x5 | reaction in ms |

- **LED current (each, when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. A loop that ends on either of two conditions (time up OR false start)
2. Pseudo-random delays from integer arithmetic
3. Deciding a winner from two inputs read in one loop

```assert
net R_PU_keyA.b V 5.00 +-0.01
net R_PU_keyB.b V 5.00 +-0.01
```
