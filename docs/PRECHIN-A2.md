# PRECHIN A2 hardware contract

Bench-verified on the STC89C52RC A2 board on 2026-08-25. This file is
the BrickWright-side contract; the detailed measurements and vendor-DVD
provenance live in `stc/docs/BOARD-PRECHIN-A2.md`.

| Peripheral | MCU wiring | Important condition |
|---|---|---|
| LCD1602 | D4–D7=P0.4–P0.7, RS=P2.6, RW=P2.5, EN=P2.7 | J24 OE–VCC; module rotated 180°, slightly over MCU |
| 8×8 matrix | columns=P0 active-low; one 74HC595 SER=P3.4, RCLK=P3.5, SCLK=P3.6 | J24 OE–GND enables it; Q7 is top row |
| 8-digit 7-seg | segments=P0 through 74HC245; select=P2.2–P2.4 through 74HC138 | common cathode, binary digit select |
| D1–D8 | P2.0–P2.7 active-low | D6/P2.5 also drives BZ1 |
| 4×4 keypad | rows=P1.7–P1.4; columns=P1.3–P1.0 | direct matrix, no encoder |
| K1–K4 | P3.1, P3.0, P3.2, P3.3 active-low | remove both P5 UART shunts after flashing for K1/K2 |
| IR | P3.2/INT0 | NEC remote verified |
| DS1302 | IO=P3.4, CE=P3.5, SCLK=P3.6 | backup supply on tested board did not retain valid time |
| DS18B20 | P3.7 | J12 fitted; keep XPT2046 deselected |
| ET/XPT2046 | DIN=P3.4, CS=P3.5, DCLK=P3.6, DOUT=P3.7 | A0 pot and A1 NTC work; A2 LDR did not respond; A3 is J52 IN3 |
| AT24C02 | SDA=P2.0, SCL=P2.1 | transactional write/read/restore passed |
| DAC | PWM=P2.1 through filter/LM358 to J52 DAC | fit J52 DAC–IN3 only for loopback |
| BZ1 | P2.5 | shared with LCD RW and D6 |

## Conflicts that examples must not hide

- The matrix, LCD, and 7-segment segment bus share P0. J24 disables only
  the matrix outputs; firmware should still exercise one display mode at a
  time.
- The LED row shares all of P2 with display select, EEPROM/DAC, LCD control,
  and the buzzer. A stable independent LED pattern cannot coexist with the
  multiplexed 7-segment display.
- P3.4–P3.7 are reused by the matrix shift register, XPT2046, DS1302, and
  DS18B20. Chip-select/enable lines must release inactive devices.
- RSTK1 is hardware reset, not an application key.

Use `PART lcd = LCD1602 DATA ... RS ... RW ... EN ...` for the A2 socket.
For a generic write-only breadboard LCD, omit RW and end the declaration
with `WRITE ONLY`, tying the module's RW pin to GND.
