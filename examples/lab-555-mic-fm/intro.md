# Your voice bends the pitch

Speak into a loudspeaker and a tone wobbles in time with your voice: the louder you speak, the more it wobbles.

**Teaches:** frequency modulation, microphone preamplifier, control voltage

## What to do

Click **Sim** and listen to the steady tone. Raise the sound slider of the loudspeaker (speaker_3) to about 94 dB (speaking loudly, close up), then back to 0.

## What you should see

- Silence: a steady tone of about 1.4 kHz.
- Speaking: the tone wavers up and down by about 5 %.

## Why it works

The loudspeaker works backwards as a microphone. Two transistors amplify its tiny voltage to about a volt, and a capacitor passes that onto the 555's control pin. The control pin sets the voltages at which the 555 switches; when your voice pushes it up, the tone gets lower, when it pulls it down, the tone gets higher.
