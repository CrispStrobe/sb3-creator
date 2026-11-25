# Beats between two different oscillators

Two tone generators of quite different kinds – a 555 timer and an audio amplifier made to oscillate – play almost the same note. Together they swell and fade: a beat. Tune them closer and the beat slows down.

**Teaches:** beats, difference frequency, superposition

## What to do

Click **Sim** and listen to the earphone (earphone_19): a fluttering tone. Turn TUNE (potentiometer_13) slowly down from 0.35 towards 0.25 and listen to the flutter slow down.

## What you should see

- At 0.35: the 555 at about 460 Hz, the amplifier oscillator at about 513 Hz, a flutter of about 52 per second.
- Turning down: the flutter gets slower; near 0.26 the two notes are almost the same and the swells come only a few times a second.

## Why it works

Both square waves are added in one mixing point. When they are high and low at the same moments, the sum swings from bottom to top: loud. Because one is a little faster, it drifts ahead until they are opposite – one high while the other is low – and the sum just sits in the middle: quiet. The time for one full drift is one over the difference of the two frequencies.
