# AM test transmitter and a receiver across the room

Two circuits on one bench. On the left a transmitter: a transistor oscillator on a ferrite rod (the tank in its collector, a small coupling winding feeding the base in step) makes a carrier near 800 kHz, and a second transistor that draws the oscillator's current, driven by a 1 kHz audio signal, makes the carrier's size follow the sound — amplitude modulation. On the right a crystal set on a second ferrite rod, half a metre away: the transmitter's magnetic field reaches its rod and it plays the tone.

**Teaches:** oscillator + modulator = transmitter, magnetic near field, why such a transmitter only reaches a few metres

## What to do

Click **Sim** and listen to the crystal earphone. Then select the receiver's ferrite rod and change its `distanceM` from 0.5 to 1 and 2 (metres).

## What you should see

- At 0.5 m the receiver's tank carries a third of a volt of RF and the 1 kHz tone is clearly there.
- At 1 m the RF is an eighth of that (the near field falls with the cube of the distance) and the tone almost gone; at 2 m nothing.
- Turning either rod so they are no longer parallel weakens the link too.

## Why it works

The oscillator keeps its tank swinging by feeding back a little of its collector signal through the coupling winding. How big the swing gets depends on the current the transistor may draw — and that current is set by the modulator transistor, whose base follows the audio. So the carrier swells and shrinks a thousand times a second. Close to a coil, its magnetic field falls as one over distance cubed; a crystal set has no amplifier, and its diode becomes a poor (square-law) detector when the signal is weak, so the tone fades even faster than the RF.
