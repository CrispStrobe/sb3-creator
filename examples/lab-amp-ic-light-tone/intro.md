# Light-controlled tone

An LM386 amplifier makes a tone, and a phototransistor in its timing path decides the pitch: in the dark a low note, in light a high one. Move your hand over the phototransistor and the tone swoops like a quacking duck.

**Teaches:** phototransistor as a light-controlled current, RC oscillator pitch, an amplifier as a tone generator

## What to do

Click **Sim** and listen. Move the phototransistor's light slider up and down. Then flip the slide switch to the larger capacitor.

## What you should see

- Dark: a tone of about 680 Hz.
- Light at 0.3: about 1.7 kHz. Full light: about 1.9 kHz.
- With the larger capacitor every note is about five times lower.

## Why it works

The amplifier's output flips each time the capacitor's voltage reaches one of two switching points. The capacitor charges through a resistor and, in parallel, through the phototransistor, which passes more current the more light it gets. More light, faster charging, sooner the flip: a higher tone.
