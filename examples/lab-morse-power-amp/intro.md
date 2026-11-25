# Morse buzzer with a power amplifier

Two transistors make a tone, and an LM386 power amplifier drives the speaker with it. A Morse key switches the oscillator on and off. A resistor divider in between sets how much signal reaches the amplifier, and a resistor across the amplifier's gain pins sets how strongly it amplifies. Give it too much signal and it overdrives: the tone gets harsh instead of louder.

**Teaches:** transistor astable as a tone source, attenuator, amplifier gain, clipping

## What to do

Click **Sim** and press the button (the Morse key) in short and long presses. Then try the two slide switches: the attenuator (strong or weak) and the gain resistor.

## What you should see

- Key up: silence. Key down: a tone of about 780 Hz.
- Strong attenuation: a quiet clean tone. With the gain resistor in: about three times louder.
- Weak attenuation: the amplifier output hits its limits at 0.9 V and about 8.1 V: the tone is distorted, and more gain does not help.

## Why it works

The transistors take turns switching on, which makes a square-wave tone at their collectors. The divider passes only a small part of it to the amplifier, which multiplies it by 20, or by more with the resistor and capacitor across its gain pins. An amplifier cannot swing its output beyond its supply: a signal that would need more is cut flat, which is what overdriving sounds like.
