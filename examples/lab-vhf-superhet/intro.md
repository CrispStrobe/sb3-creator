# An FM superhet for the VHF band

A radio for the FM broadcast band works like a medium-wave superhet, only a hundred times higher: a local oscillator 10.7 MHz above the station mixes it down to a fixed intermediate frequency, where a ceramic filter picks it out and an FM IF chip turns its frequency swings back into sound.

**Teaches:** VHF superhet, tuning with varicaps, the 10.7 MHz IF and its ceramic filter, limiting and FM detection

## What to do

Click **Sim** and listen in the earphone: the station on 98 MHz plays a 1 kHz tone. Turn the **tuning pot**: the tone is gone; at about 0.75 it is back.

## What you should see

- Tuning pot at 0.75: a clean 1 kHz tone.
- Tuning pot elsewhere: silence (or the hiss of the IF between stations).

## Why it works

The tuning voltage reverse-biases two varicaps, one in the aerial circuit and one in the oscillator circuit; turning the pot changes both capacitances together, so the oscillator stays about 10.7 MHz above whatever the aerial circuit is tuned to. The mixer chip multiplies the station by the oscillator, and only their difference — 10.7 MHz — passes the ceramic filter. The IF chip amplifies it until it clips, which wipes out any amplitude change, then compares its phase with a copy through a tuned circuit: the result follows the frequency, and an FM station's frequency carries its programme.
