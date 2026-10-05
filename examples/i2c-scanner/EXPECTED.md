# i2c-scanner -- expected behaviour

## Circuit

- One I2C bus: SDA on P1.6, SCL on P1.7 (hardware I2C pins on boards that
  have them), each line with a 4.7 kOhm pull-up to VCC.
- On it: a DS3231 (address 0x68 = 104) and an AT24C02 (A0-A2 to GND,
  address 0x50 = 80).
- Lamp `found`: VCC -> resistor -> LED -> P1.0 (active-low).

## Program

For each address 1..127: START, the address with the write bit, read the
acknowledge, STOP. An acknowledged address is printed, counted, and lights
the lamp. At the end the count is printed.

## Observable behaviour

    device at 80
    device at 104
    2 devices

and the lamp is on.
