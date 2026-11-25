# A solar cell too weak to switch: bias helps, and you hear the light

A solar cell gives about half a volt, and a transistor needs about 0.65 V at its base before it switches. Add a small bias voltage in series with the cell and light can switch the transistor: then an amplifier chip starts a tone.

**Teaches:** the base-emitter threshold, biasing, an acoustic light detector

## What to do

Click **Sim** and set the solar cell's light slider to 1: silence. Move the **slide switch** to bias. Turn the light slider to 0, then back up to 0.5.

## What you should see

- Without bias: no sound, even in full light.
- With bias, dark: no sound.
- With bias and light: a tone of about 490 Hz.

## Why it works

The cell alone reaches only 0.5 V, below the 0.65 V a silicon transistor needs. The pot adds about 0.3 V underneath the cell, so now a little light lifts the base over the threshold. The first transistor then switches off the second one, which had been holding the LM386 oscillator still, and the speaker sounds. Such light-to-sound detectors let blind people find lit windows and lamps.
