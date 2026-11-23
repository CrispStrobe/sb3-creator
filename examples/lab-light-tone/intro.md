# Light to pitch: a phototransistor tone generator

A phototransistor lets through more current the more light falls on it. Here it helps charge the timing capacitor of a 555 tone generator, so more light means a higher tone. Wave your hand over it and the pitch chirps up and down: a small light theremin with no microcontroller.

**Teaches:** a light sensor as a light-controlled current, turning a physical quantity into a frequency

## What to do

Click **Sim** and listen to the piezo. Move the light slider of the phototransistor slowly up and down, then quickly.

## What you should see

- Dark: a low hum, about 285 Hz.
- Brighter: higher, up to about 1.6 kHz in full light.
- Quick changes give chirps and slides.

## Why it works

The capacitor charges through R1 and, in parallel, through the phototransistor. Light adds current, the capacitor reaches the 555's upper threshold sooner, and the cycle repeats faster. R1 keeps the oscillator running even in complete darkness.
