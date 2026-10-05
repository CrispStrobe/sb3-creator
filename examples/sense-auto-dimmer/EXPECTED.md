# sense-auto-dimmer -- expected behaviour

## Circuit

- Light sensor: VCC -> LDR -> junction -> 10 kOhm -> GND; junction -> MCU
  P1.3 (ADC). More light means a higher reading.
- MCU P1.1 (PWM) -> 1 kOhm -> LED `lamp` -> GND (active-high).

## Program

Every 50 ms: `top` is the brightest reading seen so far (it starts at 1023 and
grows when the sensor reads more, which is how a 12-bit board's 0..4095 range
is handled), and `target` = 100 - reading x 100 / `top`: a dark room asks for
100 %, the brightest light seen so far for 0 %. The lamp's `level` moves
towards `target` by at most 5 percentage points per step and is written to the
PWM pin as a duty cycle.

## Observable behaviour

On a 10-bit board, before any reading above 1023 has been seen:

| light at the LDR | reading | target | lamp                        |
|------------------|---------|--------|-----------------------------|
| dark             | ~10     | ~99 %  | fades up to nearly full     |
| medium           | ~512    | ~50 %  | about half brightness       |
| bright           | ~1013   | ~1 %   | fades down to nearly off    |

- **Fade speed:** 5 percentage points per 50 ms, so a full swing from 0 %
  to 100 % takes about 1 s.

## What this verifies

1. Analog input to PWM output with an inverted mapping
2. Auto-ranging: the scale adapts to the board's ADC resolution
3. Rate limiting: the output follows the target in small steps
4. PWM duty set in percent

```assert
# No light control set: LDR at its dark resistance, 5 V * 10k / 1.01M.
net LDR_ldr.b V 0.0495 +-0.005
net MCU.P1.3 V 0.0495 +-0.005
```
