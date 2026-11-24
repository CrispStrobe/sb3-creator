# lab-tap-integrator — expected behaviour

## Circuit
- 9 V, one LM324 (`lm324_3`). Section 2 buffers a reference of about 1.6 V from 10 kΩ / 2.2 kΩ.
- Section 1 integrates onto 10 µF around that reference (+ input on it). A 1 kΩ resistor sits in its output lead; the "output" below means the far end of it. Sections 3 and 4 are parked.
- **Up**: a 1 µF capacitor whose free end is held at +9 V by 22 kΩ; the button throws that end to ground through 1 kΩ. Two diodes steer its charge: out of the summing node when pressed, back in from the reference when released.
- **Down**: the mirror image (free end held at ground, the button throws it to +9 V).
- **Zero**: a button with 100 Ω across the integrator capacitor.
- A moving-coil meter (6 V full scale, 1000 Ω per volt) between the output and the reference, with a silicon diode across it (cathode on the output side).

## Observable behaviour
- At switch-on the meter rests at 0: the output equals the reference.
- Each tap on **Up** moves the needle up by about 0.77 V, and it stays there. Holding the button ten times longer still gives one step: each tap moves one capacitor-full of charge.
- Each tap on **Down** moves it back by about 0.8 V.
- **Zero** returns the needle to 0.
- **Down** from zero would drive the needle backwards against its stop. The diode starts to conduct and holds the reverse reading near −0.6 V, a tenth of full scale; without it the meter would see the whole reference backwards (about −1.6 V).

## What this verifies
1. An integrator adds up charge: equal charge packets give equal steps, and between taps it holds.
2. A diode charge pump delivers a fixed charge per stroke, however long the stroke lasts.
3. A diode across a meter limits how hard it can be driven the wrong way.

```assert
# switch-on: the buffered reference (10 kΩ / 2.2 kΩ of 9 V) and the
# integrator output sitting exactly on it
net lm324_3.2_pos V 1.623 +-0.005
net lm324_3.1_pos V 1.623 +-0.005
net resistor_21.b V 1.623 +-0.005
```
