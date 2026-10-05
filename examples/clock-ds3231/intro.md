---
level: intermediate
age: 11+
prereqs: [01-blink, sense-thermometer-1wire]
teaches: [buses, time, events]
---
## What you see
The serial monitor shows the time, one line per second: 23:59:50, 23:59:51 … and then, at midnight, 0:0:0. The lamp blinks along with the seconds.

## Try this
1. Change the starting time in `set time of clock to 23 : 59 : 50`. Can you make it roll over from 9:59:59 to 10:0:0?
2. Clocks usually show 08:05 rather than 8:5. Add an IF that prints an extra "0" when the minute is below 10.
3. Make the lamp light only during the first second of each minute.

## What is going on
The clock is a separate chip, a DS3231, with its own quartz crystal. It counts seconds, minutes, hours, days, months and years all by itself — the program only has to ask. `current hour`, `current minute` and `current second` are the same Scratch blocks that read the computer's clock; on a chip they read the DS3231.

The two talk over I2C: two wires, SDA for data and SCL for the clock pulses. The program pulls the wires low or lets them go, and resistors pull them back up. Every chip on the bus has an address — the DS3231 is 0x68 — so several chips can share the same two wires.

`set time of clock to …` writes the time into the chip once. After that the program just reads; the chip keeps counting even while the program waits, and on a real board a coin cell keeps it counting with the power off.

## Why it matters
Alarm clocks, data loggers, heating timers and parking meters all need to know the time without being told every minute. A separate clock chip is how small devices keep it.

## Go further
- [eeprom-start-counter](../eeprom-start-counter) — another chip on the same two wires, one that remembers.
- [i2c-scanner](../i2c-scanner) — find out who is on the bus.
- Experiment: switch the lamp on at a set time, like an alarm clock.
