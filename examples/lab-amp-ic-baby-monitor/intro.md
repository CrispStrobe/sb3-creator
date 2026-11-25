# Baby monitor with a power amplifier

A loudspeaker also works the other way round: sound moves its cone, and its coil makes a tiny voltage. An LM386 amplifier lifts that voltage 200 times and plays it in an earphone in another room. A pot sets how sensitive the monitor is.

**Teaches:** a loudspeaker as a microphone, amplifier gain, a sensitivity control

## What to do

Click **Sim** and listen at the earphone. Turn the sensitivity pot down and up again. Set the microphone speaker's sound level slider to zero.

## What you should see

- The voice in the earphone, the amplifier's output swinging about 0.12 V.
- With the pot turned down to 0.3, about a third of that.
- With no sound, nothing: the output rests at 4.5 V.

## Why it works

Sound pressure moves the speaker's cone and its coil through the magnet, which makes a voltage of less than a millivolt. The capacitor across the amplifier's gain pins sets its gain to about 200. The pot passes only part of the microphone's voltage on to the amplifier, so it works as a sensitivity control.
