# A ringing phone switches a lamp

A loudspeaker listens for a telephone bell. A transistor and an op-amp amplify what it hears; when the ringing is loud enough, a relay pulls in and switches a lamp — standing in for any device you want switched by the bell.

**Teaches:** microphone amplifier, envelope detector, comparator, relay

## What to do

Click **Sim**. Set the loudspeaker's sound level (speaker_3) to a soft ring, about 70 dB, and watch the relay and the lamp. Raise it to a loud ring, about 85 dB. Then set it back to silence. The sensitivity knob (potentiometer_24) sets how loud is loud enough.

## What you should see

- Soft ring: nothing switches.
- Loud ring: the relay clicks in within a tenth of a second and the lamp lights.
- Silence: a moment later the relay lets go.

## Why it works

The loudspeaker makes a fraction of a millivolt. The transistor stage and the op-amp stage multiply that by several thousand. Two diodes and a capacitor turn the amplified ringing into a steady voltage that follows its loudness; a second op-amp compares that voltage with the knob's and switches the relay transistor.
