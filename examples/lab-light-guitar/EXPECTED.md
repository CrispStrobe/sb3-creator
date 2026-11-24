# lab-light-guitar — expected behaviour

## Circuit
- 9 V battery. A red LED with 470 Ω shines across a 2 cm gap at a phototransistor (emitter follower into 2.2 kΩ). A string runs through the beam and covers half of it at rest (`light_path` medium string).
- A 10 µF capacitor couples the phototransistor's emitter into a 2 kΩ magnetic earphone.
- The string is plucked once a second and dies away over about 1.5 s. The knob tunes it from 80 to 330 Hz; authored 110 Hz.

## Observable behaviour
- The earphone plays the string's note, 110 Hz, dying away and plucked again every second.
- Knob to the top: 330 Hz.

## What this verifies
1. A moving object in a beam modulates the light: an optical pickup.
2. The coupling capacitor passes the note and blocks the steady light level.

```assert
# The LED's anode: its steady drive (the string only shades its light).
net led_4.anode V 1.84 +-0.05
```
