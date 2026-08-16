# eater6502-blink — expected behaviour

## Circuit

Ben Eater 6502 breadboard computer: W65C02 CPU, 32K RAM, 32K ROM, W65C22 VIA, NAND-gate address decode. Eight red LEDs on VIA port B (PB0-PB7), each through a 330 ohm resistor to GND.

## Program

Walking light: turns on one LED at a time from PB0 to PB7, each on for 100 ms, then off before the next lights. Repeats forever.

## Observable behaviour

- LEDs light in sequence: PB0 → PB1 → PB2 → ... → PB7, then back to PB0.
- Each LED is on for **100 ms**, creating a smooth walking pattern.
- Only one LED is lit at any moment.
- Full sweep (8 LEDs) takes **800 ms**.
- The Circuit Check panel shows the NAND-gate address map the bus extractor derived.

## What this verifies

1. VIA port B output controls 8 LEDs via PB0-PB7
2. 6502 program compiles and runs correctly on the breadboard computer
3. Address decoding via NAND gates maps VIA to the correct address range
4. Each LED has a real current-limiting resistor — not just a graphical indicator
