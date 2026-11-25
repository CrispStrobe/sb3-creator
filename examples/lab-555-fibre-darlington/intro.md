# Light guide onto a photo-Darlington

Light travels through a fibre; at its far end a phototransistor and a second transistor, together a photo-Darlington, turn it into a large current. Move the fibre end closer and a 555 switches – or its tone climbs.

**Teaches:** Darlington gain, optical sensing, 555 as switch and as oscillator

## What to do

Click **Sim**. Turn the knob of the light guide (light_path_23) slowly from 10 mm down to 0 and back: watch the red FAR and green NEAR LEDs. Then move the slide switch (slide_switch_8) to the right (TONE) and turn the knob again while you listen.

## What you should see

- SWITCH: FAR at 4 mm and more, NEAR at 2 mm and less.
- TONE: about 2.1 kHz with the fibre end far, rising to about 3.4 kHz as it comes close.

## Why it works

The less gap between the fibre and the phototransistor, the more light reaches it and the more current it passes. That current alone is tiny; it flows into the base of a second transistor, which passes about a hundred times more. On the left that current makes a voltage across a resistor and the 555 switches when it passes its thresholds. On the right it helps charge the 555's timing capacitor, so each cycle is shorter and the tone higher.
