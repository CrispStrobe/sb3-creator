# A tone at every setting of the dial

A two-transistor oscillator switches the current through a coil about 1500 times a second. A radio nearby plays a steady tone, and it does not matter where it is tuned.

**Teaches:** switching edges as radio pulses, pulse rate becomes pitch, interference from switching circuits

## What to do

Click **Sim** and listen to the radio's loudspeaker. Turn its tuning knob to 0.15, then to 0.4.

## What you should see

- A steady tone of about 1.5 kHz from the loudspeaker.
- The same tone wherever the tuning knob is.

## Why it works

Each time the transistor switches, the current in the coil jumps, and so does its magnetic field. The receiving coil feels a short pulse, and a short pulse contains all frequencies: the receiver's tuned circuit rings briefly whatever it is tuned to. The detector turns each ring into a click, and 1500 clicks a second sound like a note. The coil takes its current straight from the battery; the 47 Ω and 22 µF feed the rest of the oscillator, so the coil's current steps do not upset its timing.
