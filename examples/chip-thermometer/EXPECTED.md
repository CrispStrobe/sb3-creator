# chip-thermometer -- expected behaviour

## Circuit

- One LED `beat` on D13 (active high); on other boards the pin the retarget
  assigns. Nothing else: the sensor is inside the chip.

## Program

Forever: `t` = `chip temperature` (the on-die sensor in whole degrees C),
print `Chip: <t> C`, LED on for 0.5 s if `t > 30` else 0.1 s, then off for 1 s.

## Observable behaviour

- At the default bench temperature (25 C) the monitor shows `Chip: 25 C`
  every 1.1 s, each with a 0.1 s flash.
- With the bench at 35 C: `Chip: 35 C` every 1.5 s, each with a 0.5 s flash.
- Boards with a sensor: Uno, Nano, ATmega168P, ATtiny85, Pico, STM32F030.
  The 8051 parts, the Mega2560 and the ATtiny88 refuse it by name.
