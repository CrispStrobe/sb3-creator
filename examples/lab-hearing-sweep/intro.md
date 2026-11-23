# How high can you hear? A tone sweep to 20 kHz

Young ears hear up to about 20 kHz; the limit drops with age. This 555 tone generator sweeps from a clear whistle up to the edge of hearing as you turn the knob. Stop where the sound disappears for you, and read the frequency.

**Teaches:** frequency and the range of human hearing, tuning an RC oscillator, switching capacitors to change range

## What to do

Click **Sim** and turn the knob slowly from 0 to full while listening to the piezo. Note where the tone vanishes. Switch to the low range and try again from the bottom.

## What you should see

- High range: about 2.8 kHz at 0, rising to almost 20 kHz at full.
- Low range: about 0.5 to 3.6 kHz.
- Somewhere near the top the tone becomes inaudible, for you personally.

## Why it works

The 555 charges and discharges a small capacitor through the resistors. Less resistance means faster charging and a higher tone; adding the 10 nF capacitor slows everything down by about a factor of five. The browser can only play tones up to about half its sample rate, so trust the frequency readout at the very top.
