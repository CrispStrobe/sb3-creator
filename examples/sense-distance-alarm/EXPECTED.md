# sense-distance-alarm -- expected behaviour

## Circuit

- An HC-SR04 ultrasonic module: VCC, GND, TRIG on P1.6, ECHO on P1.7 (on
  other boards the pins the retarget assigns). Its distance is the bench
  control.
- Three LEDs, each VCC -> resistor -> LED -> MCU pin (active-low):
  `far` (green) P1.0, `mid` (yellow) P1.1, `near` (red) P1.2.

## Program

Every 0.2 s:

1. `distance from sonar`: a TRIG pulse of at least 10 us; the module sends
   its 200 us burst, then holds ECHO high for 58 us per cm. The driver times
   ECHO and returns the nearest whole centimetre; no echo within 30 ms
   returns 999. Triggers are at least 60 ms apart, as the module requires.
2. The distance is printed.
3. Exactly one LED lights: `near` below 20 cm, `mid` from 20 to 49 cm,
   `far` from 50 cm (and for 999).

## Observable behaviour

| distance | printed | LED  |
|----------|---------|------|
| 5 cm     | 5       | near |
| 37 cm    | 37      | mid  |
| 120 cm   | 120     | far  |
| 600 cm   | 999     | far  |

Measured on the emulated chips (sb3-creator `test/chain-sensors.test.mjs`):
the printed distance is exact on every board, except that the 12T STC89 now
and then reads 6 for 5 cm.
