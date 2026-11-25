# The beat as a stroboscope: a mixer against the mains

Two transistors pick up the 50 Hz hum from a mains cable and square it. An amplifier chip blinks at a rate you can set near 50 Hz. Both go into a mixer chip, which multiplies them. What is left after smoothing is their *difference*: if the blinker runs at 44 Hz, the mixer's output swings six times a second, and a voltmeter between its outputs swings with it.

**Teaches:** difference frequency, beats, stroboscopic slowing-down

## What to do

Click **Sim** and watch the voltmeter between the mixer's outputs. Then turn the **RATE** knob slowly up.

## What you should see

- At RATE 0 the meter swings from minus to plus several times a second.
- Turning up, the swinging slows down until it almost stops (zero beat), then speeds up again.

## Why it works

Two square waves multiplied give a high result where they agree and a low one where they disagree. If their frequencies are slightly different, they drift in and out of step, and the smoothed product rises and falls at the difference frequency. A stroboscope works the same way: a lamp flashing almost as fast as a wheel turns shows the wheel turning slowly.
