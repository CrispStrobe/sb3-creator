# A lens on the bench: finding the image

A lens collects the light of an LED and focuses it into an image. Slide a small light sensor along the bench: the reading is highest exactly where the image forms, and that point follows the lens equation.

**Teaches:** focal length, the lens equation 1/f = 1/u + 1/v

## What to do

Click **Sim** and turn the knob slowly from one end to the other while watching the meter. Then in the inspector move the lens (`lensAtCm`) or change its focal length (`lensFocalCm`) and look for the new peak.

## What you should see

- The highest reading, about 5.6 V, at 45 cm from the LED.
- About 1.5 V at 35 cm and at 55 cm.

## Why it works

With the LED 15 cm in front of a lens of 10 cm focal length, the lens equation puts the image 30 cm behind the lens. There the light the lens caught meets in the smallest spot, so the small sensor catches the most of it. In front of or behind that point the light is spread over a larger spot.
