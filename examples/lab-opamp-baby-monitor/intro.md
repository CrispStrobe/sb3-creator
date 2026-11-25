# Baby monitor with three op-amp stages

A loudspeaker makes a microphone, but it gives only a few millionths of a volt. Three op-amp stages one after the other multiply that ten thousand or a hundred thousand times — enough to hear a quiet nursery in the next room.

**Teaches:** cascaded amplifiers, gain, decibels

## What to do

Click **Sim**. Raise the sound at the nursery loudspeaker (speaker_3) to about 50 dB and listen at the earphone (earphone_21), or probe the last op-amp's output. Close GAIN (switch_17). Then lower the sound to 30 dB.

## What you should see

- Speech at 50 dB: about a tenth of a volt at the output; with GAIN closed about 1.1 V, and the red LED begins to flicker on the loud parts.
- At 30 dB with GAIN closed: as loud as 50 dB without it.

## Why it works

Each stage multiplies what it is given: a hundred, a hundred again, then one or ten. Capacitors between the stages pass the sound but not the stages' steady voltages, so the huge gain does not amplify those.
