# sense-pir-alarm -- expected behaviour

## Circuit

- PIR motion module: VCC and GND from the rails, its `out` terminal straight to
  MCU P3.2. The module DRIVES that line (LOW = no motion, HIGH = motion), so
  there is no pull-up resistor.
- VCC (5 V) -> 1 kOhm -> LED `lamp` (Vf = 2.0 V) -> MCU P1.0 (active-low).
- MCU P1.1 -> active buzzer -> GND (on while the pin is HIGH).

## Program

Every 100 ms the program reads P3.2. While motion is seen it sets a hold
counter to 50 (50 x 100 ms = 5 s). The lamp is on while the counter is above
zero and the counter counts down once per loop, so the lamp goes out 5 s after
the LAST detection. When an alarm starts (counter was 0) the buzzer chirps
twice (100 ms on, 100 ms off) and `motion` is printed; `quiet` is printed when
the counter runs out.

## Observable behaviour

| event                      | P3.2 | lamp | buzzer          | serial    |
|----------------------------|------|------|-----------------|-----------|
| idle, no motion            | LOW  | OFF  | silent          |           |
| motion begins              | HIGH | ON   | 2 chirps        | `motion`  |
| motion continues           | HIGH | ON   | silent          |           |
| motion stops               | LOW  | ON for 5 s more | silent |          |
| hold time runs out         | LOW  | OFF  | silent          | `quiet`   |

- **LED current (when on):** (5.0 - 2.0) / 1000 = 3.0 mA

## What this verifies

1. Reading a driven digital sensor output (no pull-up needed)
2. A retriggerable hold time built from a counter, not a long wait
3. Acting only on the START of an event (chirp once, not on every retrigger)

```assert
# No motion at start: the module holds its output, and the pin, at 0 V.
net PIR_pir.out V 0.00 +-0.01
net MCU.P3.2 V 0.00 +-0.01
net PIR_pir.vcc V 5.00 +-0.01
```
