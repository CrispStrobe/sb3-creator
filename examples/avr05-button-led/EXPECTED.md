# avr05-button-led — expected behaviour

## Circuit

Button: VCC → button → D2, with 10 kΩ pull-down to GND.
LED: D13 → green LED (Vf = 2.1 V) → 220 Ω → GND.

D2 reads HIGH when the button is pressed (pull-down holds it LOW otherwise).

## Program

Polls D2 at 20 Hz. If HIGH (pressed), turns on D13; if LOW (released),
turns off D13.

## Observable behaviour

| button | D2 reading | D13 | LED |
|---|---|---|---|
| released | LOW (0) | LOW | OFF |
| pressed | HIGH (1) | HIGH | ON |

- **Response time:** ≤ 50 ms (one poll interval)
- **No debounce:** acceptable here because the response (LED on/off) is
  idempotent and the loop rate is slow enough that bounce settles within
  one period

## What this verifies

1. Digital input: `read button1` reads PIND bit 2 via `bw_pin_read`
2. Input pin configured with DDR cleared (high-impedance input)
3. External pull-down resistor provides a defined LOW when released
4. Conditional output based on input state
