# One-transistor radio

Take the crystal set, drop the diode and let a transistor do the work: its base-emitter junction detects the station, and the same transistor amplifies the sound into a magnetic earphone. A battery now adds the power the station alone could not.

**Teaches:** a transistor junction as a detector, amplification, coupling winding, bias

## What to do

Click **Sim** and listen to the earphone. Turn the tuning knob to find the other two stations, then park it between stations.

## What you should see

- Knob at 0.5: the local station's 400 Hz tone, clearly louder than in the crystal set.
- Knob at about 0.26: a station that alternates between 600 Hz and 900 Hz.
- Knob at 0.1: a quieter 1 kHz tone.
- Between stations it goes almost silent.

## Why it works

The coil has a second, small winding that passes the tuned carrier on to the transistor's base. The base-emitter junction behaves like a diode: it lets through more current on the positive swings than on the negative ones, so its average current grows and shrinks with the station's sound. The transistor multiplies that current by its gain, and the earphone in the collector turns it into a tone. The 1 MΩ resistor holds the transistor just at the edge of conducting, where it detects best; the 100 nF capacitor keeps the bottom of the small winding steady.
