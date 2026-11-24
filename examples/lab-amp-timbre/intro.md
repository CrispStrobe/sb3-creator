# Same note, different sound: filters after an oscillator

An amplifier chip made to oscillate plays a buzzy square-wave note through a loudspeaker. Two capacitors, each on its own push button, change how the note sounds without changing its pitch: one makes it brighter, the other soft and round.

**Teaches:** timbre and harmonics, high-pass and low-pass filters, pitch stays with the oscillator

## What to do

Click **Sim** and listen. Hold the left push button ("bright"), then the right one ("soft"). Put the scope's channels on both sides of the 47 Ω resistor and compare the waveforms.

## What you should see

- All three sounds have the same pitch, about 190 Hz.
- Bright: louder and sharper; the square wave's steep edges reach the speaker in full.
- Soft: a round, gentle tone; the speaker's waveform is nearly a sine wave.

## Why it works

A square wave is a fundamental plus many higher harmonics; the harmonics make it sound buzzy. A capacitor passes fast changes easily and blocks slow ones. Across the series resistor it gives the fast edges a way around it: more harmonics, a harsher sound. Across the speaker it soaks up the fast edges before they reach the cone: fewer harmonics, a softer sound. The oscillator itself is not touched, so the pitch does not change.
