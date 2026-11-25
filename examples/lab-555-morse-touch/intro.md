# Morse key and touch key on the reset pin

A tone generator that only sounds while you key it: with a normal key, or with a touch key that needs nothing but a fingertip.

**Teaches:** reset pin as an on/off input, transistor gain, skin resistance

## What to do

Click **Sim**. Tap KEY (button_10) in short and long presses: Morse code. Then hold TOUCH (button_11): the slide switch (slide_switch_12) on the left is a moist fingertip. Move it to the right (a dry fingertip) and hold TOUCH again.

## What you should see

- KEY: a tone of about 680 Hz while it is held.
- TOUCH with a moist finger: the same tone.
- TOUCH with a dry finger: nothing.

## Why it works

The 555 oscillates only while its reset pin is high. The key connects that pin to +9 V. The touch key lets a tiny current through your skin into an NPN transistor, which switches a PNP transistor, which lifts the reset pin. Together they amplify about ten thousand times: enough for the few microamps through a moist fingertip, not for the hundred times smaller current through a dry one.
