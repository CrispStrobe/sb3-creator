# Radio with a loudspeaker

A crystal set fills an earphone with the energy from the antenna, but a loudspeaker needs far more than that. Put an LM386 audio amplifier between the detector and the speaker, and the battery supplies the power while the station only supplies the pattern.

**Teaches:** detector plus power amplifier, why a loudspeaker needs power, coupling capacitors

## What to do

Click **Sim** and listen to the loudspeaker. Turn the tuning knob to 0.1 for the far station, and to about 0.26 for the station with two tones.

## What you should see

- The local station's 400 Hz tone, loud.
- At 0.1 a 1 kHz tone, much quieter, fading a little further for a moment after you turn the knob.
- At about 0.26 two tones taking turns.

## Why it works

The front end is the crystal set: coil and tuning capacitor pick the station, the germanium diode and the 2.2 nF capacitor recover the sound. That sound is only a few tenths of a volt from a source that can deliver almost no current. The LM386 copies it twenty times larger and takes the current from the battery. The 100 nF capacitor in front of it and the 220 µF capacitor behind it pass the sound but block the steady voltages, so the amplifier's input and the loudspeaker see only the changes.
