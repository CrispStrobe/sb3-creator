# sense-thermometer-1wire -- expected behaviour

## Circuit

- A DS18B20 on 1-Wire: VCC, GND, DQ on P1.7 (on other boards the pin the
  retarget assigns), with a 4.7 kOhm pull-up from DQ to VCC. Its temperature
  is the bench control.
- Two LEDs, each VCC -> resistor -> LED -> MCU pin (active-low): `cold`
  P1.0, `warm` P1.1.

## Program

Every second:

1. `temperature from probe`: bus reset and presence pulse, SKIP ROM, then
   either CONVERT T (when no conversion is running) or READ SCRATCHPAD (when
   the last one has finished). The nine scratchpad bytes are checked with the
   Dallas CRC-8; a bad read is discarded. The result is whole degrees,
   rounded the way Scratch rounds (half up). The first read waits for one
   conversion; later reads return the last finished one. With no sensor
   answering, -127.
2. The temperature is printed.
3. `cold` is on below 18 °C, `warm` above 28 °C.

## Observable behaviour

| sensor   | printed | cold | warm |
|----------|---------|------|------|
| 15.0 °C  | 15      | on   | off  |
| 23.4 °C  | 23      | off  | off  |
| 31.0 °C  | 31      | off  | on   |
| -10.5 °C | -10     | on   | off  |

A new setting shows up within about one conversion (0.75 s) plus one loop.
