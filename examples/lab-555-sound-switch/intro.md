# Switched by a clap or a torch

Clap your hands and a relay switches a lamp on for a couple of seconds. Talking does not do it – it takes a loud sound. Flip a switch and a torch does the same job.

**Teaches:** loudspeaker as microphone, transistor amplifier, threshold, monostable

## What to do

Click **Sim** and wait a moment. Raise the sound slider of the loudspeaker (speaker_3) to 70 dB (talking), then to 100 dB (a clap), then back to 0. Then move the slide switch (slide_switch_15) to the right and drag the light slider of the phototransistor (phototransistor_16) up.

## What you should see

- 70 dB or 90 dB: nothing.
- 100 dB: the relay (relay_27) clicks and the lamp lights for about 2.4 s.
- Light mode: the lamp lights when the torch shines.

## Why it works

Sound moves the loudspeaker's cone and its coil makes a tiny voltage. Two transistor stages make it about a thousand times bigger. A third transistor only switches on when the peaks pass about 0.6 V – a clap does that, speech does not. It pulls the 555's trigger low, and the 555 keeps the relay on for a fixed time.
