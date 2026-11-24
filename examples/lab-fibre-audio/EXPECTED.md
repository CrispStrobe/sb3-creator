# lab-fibre-audio — expected behaviour

## Circuit
- 9 V battery. Transmitter: a 555 astable (1 kΩ, 10 kΩ, 100 nF) at about 679 Hz switches a red LED through 330 Ω, so the LED flashes at the tone.
- A 2 m light guide carries the flashes. Receiver: a phototransistor, collector to +9 V, emitter into 2.2 kΩ; a 10 µF capacitor couples the changing emitter voltage into a 2 kΩ magnetic earphone.
- The light path's knob is the gap at the receiver end, 0 to 20 mm; authored 1 mm.

## Observable behaviour
- The earphone plays the transmitter's tone, about 679 Hz.
- With a 10 mm gap the tone is the same pitch, but its current falls below a tenth: quieter, not lower. Brightness carries the loudness.
- Block the path (`blocked` 1) and the earphone is silent; nothing but light connects the two halves.

## What this verifies
1. Light can carry a signal: switching the LED with a tone modulates the light.
2. A coupling capacitor passes the tone and blocks the steady part of the receiver's voltage.

```assert
# The transmitter 555's control pin at two thirds of the supply.
net timer_555_3.control V 6.00 +-0.05
```
