# Brake-light check: a latch remembers a dark brake lamp

A car's brake lamp should light whenever you brake. A light guide brings its light back to the dashboard, and two NAND gates remember if it ever stayed dark: a red warning that stays on until you reset it.

**Teaches:** the set/reset latch, checking with a delay, light guides

## What to do

Click **Sim**. Press the pedal button: the brake lamp lights and the green LED stays on. Now set the slide switch to "blown" and press the pedal again. Release it, then press the reset button.

## What you should see

- Good lamp: green stays on whatever you do with the pedal.
- Blown lamp: the red LED comes on when you brake and stays on after you let go.
- Reset: green again.

## Why it works

Gate 1 asks: is the pedal pressed AND is it dark at the end of the light guide? Only then does it set the latch of gates 2 and 3, which keeps its state until the reset input is pulled low. A short delay on the pedal line gives a good lamp time to light first; on release a diode skips the delay, so switching the lamp off is never mistaken for a fault.
