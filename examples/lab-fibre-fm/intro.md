# FM over a light guide (100 kHz)

The LED flashes about 100,000 times a second, and the potentiometer changes how often. At the far end of a light guide a phototransistor and a diode pump turn the flash rate back into a voltage. The information travels in the frequency, not in the brightness.

**Teaches:** frequency modulation, why FM ignores losses, a frequency-to-voltage converter

## What to do

Click **Sim** and watch the meter. Turn the potentiometer and wait a moment for the meter to settle. Then pull the fibre end back a few millimetres with the light guide's knob. The simulation is slow here: 100 kHz needs very small time steps.

## What you should see

- Potentiometer low: the meter reads about 1.5 V.
- Potentiometer high: about 1.25 V.
- A small gap at the fibre end hardly changes the reading.

## Why it works

The potentiometer sets the 555's control voltage, and with it the flash frequency. At the receiver every flash switches the phototransistor fully on, so every flash pushes the same small charge through the 100 pF capacitor and the diodes. More flashes per second means more charge per second, and a higher average voltage. As long as each flash still switches the phototransistor, a dimmer light changes nothing: that is why radio stations and links that must ignore losses use FM.
