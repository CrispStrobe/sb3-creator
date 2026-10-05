---
level: intermediate
age: 11+
prereqs: [05-counter, clock-ds3231]
teaches: [memory, buses, variables]
---
## What you see
At every start the program prints how often it has been started — "Started 1 times", then 2, 3 … — and blinks the lamp that many times. Restart it and the number goes up, even though every variable starts at 0 again.

## Try this
1. Restart the program a few times. Does the count keep going?
2. Add a button that sets the counter back to 0.
3. Store a second number at address 1: the highest score of a game, for example.

## What is going on
Variables live in the chip's working memory (RAM), which forgets everything when the power goes off. An EEPROM keeps its bytes for decades without power. This one, an AT24C02, holds 256 bytes, numbered 0 to 255, and sits on the same two I2C wires as other chips.

`byte 0 of memory` reads the byte at address 0 and `store starts at 0 in memory` writes it. A byte holds a number from 0 to 255; a bigger number keeps only its last 8 bits (300 becomes 44). A brand-new EEPROM reads 255 everywhere, which is why the program treats 255 as "never started".

Writing takes the chip a few milliseconds, during which it does not answer. The program asks its address again and again until it does — then the byte is safe.

## Why it matters
Settings, calibration values, high scores and counters like the kilometres in a car survive switching off because they are kept in this kind of memory.

## Go further
- [clock-ds3231](../clock-ds3231) — a clock chip on the same bus.
- [i2c-scanner](../i2c-scanner) — see both chips answer.
- Experiment: keep the last ten temperatures from a thermometer and print them at start.
