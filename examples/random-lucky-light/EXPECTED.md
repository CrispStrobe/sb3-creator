# random-lucky-light -- expected behaviour

## Circuit

- Button `btn` on P3.2 with a pull-up; pressing connects the pin to GND
  (active-low).
- Four LEDs, each VCC -> resistor -> LED -> MCU pin (active-low):
  `led1` P1.0, `led2` P1.1, `led3` P1.2, `led4` P1.3. On other boards the
  pins (and their polarity) are the ones the retarget assigns.

## Program

Nothing happens until the button is pressed. Each press (an edge, not a
held level) runs the script once:

1. Eight times: `lamp` = `pick random 1 to 4`, light only that lamp, wait
   0.06 s.
2. `lamp` = `pick random 1 to 4` once more; that lamp stays lit.

`pick random` is an xorshift32 generator; with the scheduler running the
millisecond count at the moment of each draw is mixed in, so the outcome
depends on when the button was pressed.

## Observable behaviour

- After every press, about 0.5 s later, exactly one of the four lamps is on.
- Over many presses each lamp wins.
- Holding the button does not start a second run.
