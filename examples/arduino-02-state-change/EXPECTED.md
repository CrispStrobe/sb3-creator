# arduino-02-state-change — expected behaviour

## Circuit

Arduino Uno D2 <- pushbutton -> VCC (5 V). 10 kohm pull-down from D2 to GND. D13 → 220 ohm resistor → red LED → GND.

## Program

Counts button presses. On every LOW->HIGH transition, increments a counter and prints it. LED turns ON when the counter is a multiple of 4, OFF otherwise.

## Observable behaviour

- **Press 1:** serial prints **1**. LED stays OFF (1 mod 4 != 0).
- **Press 2:** serial prints **2**. LED OFF.
- **Press 3:** serial prints **3**. LED OFF.
- **Press 4:** serial prints **4**. LED turns **ON** (4 mod 4 = 0).
- **Press 5:** serial prints **5**. LED turns OFF again.
- Pattern repeats every 4 presses.

## What this verifies

1. Edge detection: only counts LOW->HIGH transitions, ignores held state
2. Modulo logic: `(buttonPushCounter mod 4) = 0` gates the LED
3. 50 ms debounce delay on state change
