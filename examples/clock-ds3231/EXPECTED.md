# clock-ds3231 -- expected behaviour

## Circuit

- A DS3231 real-time clock on I2C: SDA on P1.6, SCL on P1.7 (on boards with
  hardware I2C pins, those: A4/A5 on the Uno, GP4/GP5 on the Pico), each
  line with a 4.7 kOhm pull-up to VCC.
- Lamp `tick`: VCC -> resistor -> LED -> P1.0 (active-low).

## Program

1. `set time of clock to 23 : 59 : 50` writes seconds, minutes and hours
   (BCD, 24-hour) to registers 0-2 and clears the oscillator-stopped flag.
2. Every 0.1 s it reads `current second`; when it differs from the last one
   it prints `hour:minute:second` (no leading zeros) and toggles the lamp.

## Observable behaviour

One line per second, the first ones:

    23:59:50
    23:59:51
    ...
    23:59:59
    0:0:0
    0:0:1

and the lamp changes state with every line.
