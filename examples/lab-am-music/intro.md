# How AM carries music

A station sends a carrier near 600 kHz whose strength rises and falls with the sound. Here the station plays a little tune over and over. A crystal set picks the station out and a germanium diode recovers the strength of the carrier, which is the music, straight into a crystal earphone: no battery, the station itself powers it.

**Teaches:** amplitude modulation, envelope detection, tuning

## What to do

Click **Sim** and listen to the earphone. Probe the top of the tuned circuit and the diode's output. Then turn the tuning knob away from 0.5.

## What you should see

- The tune, note by note, in the earphone (392, 330, 330, 349, 294, 294, 262 Hz and a rest).
- The diode's output is a DC level with the notes riding on it: the envelope of the carrier.
- Turned away from 0.5 the music fades: the tuned circuit no longer passes this station.

## Why it works

Amplitude modulation means the carrier's size follows the sound: louder parts of a note make it bigger, quieter parts smaller. The diode lets the carrier through in one direction only and charges the small capacitor to its peaks; the 47 kΩ lets it discharge fast enough to follow the highest note but not the carrier itself. What is left is the sound, and the crystal earphone turns it into the tune.
