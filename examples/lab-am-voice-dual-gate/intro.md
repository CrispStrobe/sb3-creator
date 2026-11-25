# Voice on the air: a dual-gate MOSFET modulator

An oscillator makes a medium-wave carrier and feeds it into gate 1 of a dual-gate MOSFET, which drives a second ferrite rod — the transmitting antenna. Gate 2 decides how much the MOSFET amplifies: a pot sets it, and the amplifier chip adds the sound from a loudspeaker used as a microphone. A crystal set half a metre away listens.

**Teaches:** amplitude modulation, a dual-gate MOSFET as a multiplier

## What to do

Select the speaker-microphone and set its **sound** to silent, click **Sim** and listen to the crystal earphone. Then raise the sound again (100 dB: a whistle right at it). Try the **bias pot** on gate 2.

## What you should see

- Silent: the receiver gets a steady carrier; nothing to hear.
- With sound: the receiver's detector carries the 500 Hz tone — about fifteen times more than without.
- The pot sets how much carrier gets through: turned down, the channel nears pinch-off and the carrier weakens.

## Why it works

The two gates of this MOSFET control one channel in series. Gate 1 carries the carrier; gate 2, held near the point where it would pinch the channel off, decides how much of that current may flow. The amplified sound moves gate 2, so the carrier's size follows the sound — exactly what amplitude modulation is.
