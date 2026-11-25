# Light organ with a power amplifier

A loudspeaker listens to the music and works as a microphone. An LM386 amplifies what it picks up 200 times, and a transistor flashes a red LED on the loud parts. A slide switch adds a transistor preamplifier with a sensitivity knob, so ordinary music is enough.

**Teaches:** loudspeaker as microphone, amplifier gain, transistor LED driver, preamplifier and sensitivity

## What to do

Click **Sim**. In the instruments column push the **Sound** slider at the loudspeaker to about 80 (music in the room), then to 110 (very loud, right at the speaker). Then flip the slide switch to the preamp and try 80 dB again, turning the SENSITIVITY pot.

## What you should see

- Without the preamp: nothing at 80 dB; the LED flashes only with very loud sound.
- With the preamp: the LED flickers at 80 dB; turn the pot down and it goes dark.

## Why it works

Sound moves the speaker's cone and its coil makes a tiny voltage, well under a millivolt for normal music. The LM386 with a capacitor across its gain pins multiplies it by 200. The capacitor and diode in front of the LED transistor pass only the positive peaks, and the transistor needs about 0.7 V to switch on, so the LED lights only on loud moments. The extra transistor stage multiplies the signal again before the LM386; the pot decides how much of that reaches it.
