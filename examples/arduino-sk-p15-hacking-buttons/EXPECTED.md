# arduino-sk-p15-hacking-buttons — expected behaviour

## Circuit

Arduino Uno D2 → optocoupler or output device → GND.

## Program

Toggles D2 on and off at 1 Hz: 500 ms on, 500 ms off, forever. Simulates pressing an external button via an optocoupler.

## Observable behaviour

- **D2 output** alternates: HIGH for 500 ms, LOW for 500 ms.
- If an LED or indicator is connected, it blinks at 1 Hz.
- The pattern is identical to basic blink but on D2 instead of D13.

## What this verifies

1. Digital output toggling on D2
2. Optocoupler concept: using a pin to simulate a button press
3. Fixed 1 Hz timing with `wait 0.5 seconds`
