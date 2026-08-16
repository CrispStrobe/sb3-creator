---
level: beginner
age: 8+
prereqs: [arduino-01-blink]
teaches: [digital-input, button, led-control]
---
## What you see
A pushbutton on D2 turns an LED on D13 on when pressed and off when released. The simplest input-to-output connection.

## Try this
1. Press the button and watch the LED follow it instantly.
2. Swap the IF logic so the LED is on when the button is NOT pressed.
3. Add a second button on D3 that controls a second LED independently.

## What is going on
The program reads D2 as a digital input (0 or 1). When the button connects D2 to 5 V through a pull-down resistor, the reading is HIGH and the LED turns on. When released, the pin reads LOW and the LED turns off. No state is stored — the LED mirrors the button in real time.

## Go further
- [arduino-02-debounce](../arduino-02-debounce) — handle the mechanical bounce that causes glitches.
- [arduino-02-state-change](../arduino-02-state-change) — count button presses instead of mirroring.
