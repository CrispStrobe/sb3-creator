# A superhet on a mixer IC

Every good radio since the 1930s works this way: it does not amplify the station at the station's own frequency but first converts it to one fixed intermediate frequency (IF), 455 kHz here, where one sharp filter and one amplifier do the work for every station.

**Teaches:** frequency conversion in a mixer, the intermediate frequency, tracking of two tuned circuits, the image frequency

## What to do

Click **Sim** and listen: the 612 kHz station. Turn the oscillator's knob (the second tuning capacitor) a little: the station is gone, although the aerial knob still points at it. Then try the two slide switches: **Loose** couples the antenna through 10 pF (retune the aerial knob a touch, to about 0.53); **Low IF** pulls the IF down to about 295 kHz — set the oscillator knob to 0.30, and a strong station on 1200 kHz now comes in along with 612 kHz.

## What you should see

- Both knobs as set: the 612 kHz station's 400 Hz tone.
- The oscillator knob moved slightly: silence.
- Loose coupling: a little weaker, and the neighbouring station on 810 kHz is held back better.
- Low IF and the oscillator at 0.30: the 1200 kHz station's 1 kHz tone mixes in — the image.

## Why it works

The mixer IC multiplies the station by its own oscillator. The product contains their difference frequency, and only when that difference is 455 kHz does it reach the IF coil, whose tuned circuit lets nothing else through. So the oscillator must always sit an IF above the station: the two knobs have to move together. But a station an IF *above* the oscillator gives the same difference — the image. With a 455 kHz IF the image of 612 kHz is at 1523 kHz, far enough away for the aerial tuned circuit to keep it out; with a low IF it is only 590 kHz away, where a strong station sits and gets through.
