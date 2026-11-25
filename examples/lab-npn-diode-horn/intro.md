---
level: intermediate
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, diode, timbre, sound]
---
## What you see
A transistor tone generator keyed by a button, with a germanium diode in one of its two coupling paths. The **PLAIN** switch bridges the diode.

## Try this
1. Click **Sim** and hold the key: a low horn note.
2. Open **PLAIN** so the diode is in the path, and hold the key again: the note changes; it is a little higher and sounds different.
3. Switch back and forth while holding the key to compare.

## What is going on
A coupling capacitor normally passes the switching edges both ways: it pulls the next transistor's base down, and it is pushed back up when the stage switches back. A diode lets current through in one direction only. With the diode in the path the capacitor can still pull the base down, but it cannot be pushed back up through the base; a 47 kΩ resistor lets it relax instead, and only partly before the next edge. So that half of each cycle gets shorter: the note rises and the earphone is on for a larger share of each cycle, which changes the sound's colour (its timbre), not just its pitch.

## Go further
- [lab-astable-tone](../lab-astable-tone) — the plain oscillator.
