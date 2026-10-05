# eeprom-start-counter -- expected behaviour

## Circuit

- An AT24C02 EEPROM on I2C: SDA on P1.6, SCL on P1.7 (hardware I2C pins on
  boards that have them), each line with a 4.7 kOhm pull-up to VCC; A0-A2
  and WP tied to GND, so its address is 0x50 and writes are allowed.
- Lamp `lamp`: VCC -> resistor -> LED -> P1.0 (active-low).

## Program

1. Read byte 0. 255 (an erased cell) counts as 0.
2. Add 1, store it back at address 0. The store waits out the chip's write
   cycle by polling its address until it acknowledges.
3. Print `Started N times` and blink the lamp N times (0.2 s on, 0.2 s off).

## Observable behaviour

| start | printed          | blinks |
|-------|------------------|--------|
| 1st   | Started 1 times  | 1      |
| 2nd   | Started 2 times  | 2      |

The EEPROM keeps its contents while the bench stays loaded; a fresh bench is
a fresh, erased chip.
