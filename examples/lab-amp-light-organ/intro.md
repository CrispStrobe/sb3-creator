# Light organ with an amplifier

The music player's signal is weak. An amplifier makes it strong enough; then two filters split it, and the bass lights a red LED and the treble a blue one.

**Teaches:** audio amplifier, high-pass and low-pass filters, transistor as switch

## What to do

Click **Sim**. The function generator (function_gen_3) stands in for the music at 80 Hz: watch the two LEDs. Raise its frequency step by step to 300 Hz and then 1500 Hz.

## What you should see

- 80 Hz: red glows, blue is dark.
- Around 300 Hz: both glow a little.
- 1500 Hz: blue glows, red is dark.

## Why it works

The amplifier turns 0.15 V into about 3 V. A small capacitor in the treble path lets only fast swings through to the blue LED's transistor; in the bass path a large capacitor to ground swallows fast swings, so only slow ones reach the red LED's transistor. A transistor needs about 0.7 V at its base before it conducts, which is why the amplifier is needed.
