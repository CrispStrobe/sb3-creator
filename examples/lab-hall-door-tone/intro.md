# Magnet at the door: a Hall switch starts a tone

A Hall switch notices a magnet without touching it. Here it switches a transistor that releases an amplifier chip's tone oscillator: a door alarm that sounds when the magnet on the door comes close.

**Teaches:** Hall effect switches, a transistor as an enable switch, an LM386 tone oscillator

## What to do

Click **Sim**. Set the Hall sensor's field to 0.8, then back to 0.

## What you should see

- No magnet: the LED is dark and the speaker silent.
- Magnet: the LED lights and a tone of about 500 Hz sounds.
- Magnet away: silent again.

## Why it works

Without a magnet the Hall switch's output is high, so the transistor conducts and holds the oscillator's capacitor at ground. A strong enough field pulls the output low: the transistor lets go, and the LM386 charges and discharges its capacitor through its own feedback, which makes the tone. The same output lights the LED. Alarm contacts on windows and the lid sensor of a laptop work like this.
