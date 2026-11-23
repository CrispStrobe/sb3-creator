---
level: intermediate
age: 12+
prereqs: [pc67-555-tongenerator, pc43-bleeder-discharge]
teaches: [envelope, attack-decay, RC-discharge, sound-synthesis, 555-timer]
---
## What you see
A doorbell or a piano note does not just switch on and off: it starts loud and fades. Tap KEY and this circuit does the same, a note that rings out over about two seconds. Hold KEY and the note sustains.

## Try this
1. Start the simulation. The 555 is already running, yet you hear nothing.
2. Tap KEY briefly. The note starts loud and dies away.
3. Hold KEY down: the note stays loud. Release it and the decay begins.
4. Turn DECAY up and down between taps to make a long gong or a short pluck.

## What is going on
The 555 makes a steady tone, but the speaker can only be as loud as the voltage on C_env. KEY fills that capacitor almost instantly (the attack); then it drains through the decay resistors over a second or so (the decay), and the speaker's swing shrinks with it. The time constant is R × C, so a bigger DECAY setting means a longer ring. Synthesizers separate the same two jobs: an oscillator decides what note you hear, an envelope decides how it starts and ends.

## Go further
- [lab-siren-glide](../lab-siren-glide): a capacitor shaping pitch instead of loudness.
- [pc43-bleeder-discharge](../pc43-bleeder-discharge): a capacitor draining through a resistor.
