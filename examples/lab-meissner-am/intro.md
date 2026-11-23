# LC oscillator with feedback coil, and amplitude modulation

A transistor amplifier oscillates when a second winding on its tuning coil feeds part of the output back to the input at the right moment. The coil and capacitor set the frequency. A second transistor then lets an audio signal control how much of that carrier gets through: amplitude modulation, the way AM radio puts sound on a carrier.

**Teaches:** positive feedback, LC resonance, amplitude modulation

## What to do

Click **Sim** and open the scope. Channel 1 shows the oscillator, channel 2 the modulated output. Change the audio generator's amplitude, then try a different tank capacitor.

## What you should see

- A steady sine of about 10.7 kHz on channel 1.
- On channel 2, bursts of carrier whose height follows the 500 Hz audio.
- More audio: the bursts pinch off completely between peaks.

## Why it works

The tank in the collector rings at its own frequency. The feedback winding hands a little of that ringing back to the base, in step, so every cycle is topped up and the oscillation keeps going. Q2 is biased right at the edge of conducting; the audio voltage moves that edge up and down, so more or less of each carrier peak gets through. Here the carrier is scaled down from radio frequencies so the simulation stays quick; the principle is the same.
