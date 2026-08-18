# arduino-sk-p08-hourglass — expected behaviour

## Circuit

Arduino Uno D2-D7 → six LEDs → GND. D8 <- tilt switch with pull-down.

## Program

Lights LEDs one at a time at a fixed interval (10 seconds each), building up from 0 to 6. The tilt switch on D8 resets the count. Simulates sand falling through an hourglass.

## Observable behaviour

- **Start:** all LEDs OFF.
- **After 10 s:** LED on D2 turns ON.
- **After 20 s:** LEDs on D2 and D3 are ON.
- **After 60 s:** all six LEDs are ON — hourglass complete.
- **Tilt switch triggered:** all LEDs turn OFF, count resets to 0.
- LEDs accumulate — once lit, they stay on until reset.

## What this verifies

1. Timed accumulation: one LED per interval
2. Tilt switch as reset trigger
3. Six-LED sequential fill pattern

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
