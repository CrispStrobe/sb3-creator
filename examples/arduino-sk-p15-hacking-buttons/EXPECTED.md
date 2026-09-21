# arduino-sk-p15-hacking-buttons — expected behaviour

## Circuit

Arduino Uno D2 → 1 kohm → optocoupler LED (anode), cathode → GND. On the isolated side: VCC → 1 kohm → indicator LED → optocoupler collector, emitter → GND. The two sides share no node; the only path between them is the coupler itself.

## Program

Toggles D2 on and off at 1 Hz: 500 ms on, 500 ms off, forever. Simulates pressing an external button via an optocoupler.

## Observable behaviour

- **D2 output** alternates: HIGH for 500 ms, LOW for 500 ms.
- The indicator on the isolated side blinks at 1 Hz, driven only through the coupler.
- The pattern is identical to basic blink but on D2 instead of D13.

## What this verifies

1. Digital output toggling on D2
2. Optocoupler concept: using a pin to simulate a button press
3. Fixed 1 Hz timing with `wait 0.5 seconds`

```assert
# Supply rail: VCC = 5.0V
net VCC.vcc V 5.00 +-0.01
# At rest D2 is low, so the coupler's own LED sees nothing.
net OPTO1.anode V 0.00 +-0.01
# With the phototransistor dark, no current flows in the isolated branch:
# both ends of the indicator sit at the rail, so it is off.
net LED_opto.anode V 5.00 +-0.01
net LED_opto.cathode V 5.00 +-0.01
```
