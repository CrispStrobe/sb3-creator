# Tail-light check: a tone when the lamp goes dark

In a car the tail lamps are behind you, so you cannot see when one fails. A light guide brings their light to the dashboard; as long as it glows, all is quiet. When the bulb fails, a warning tone sounds.

**Teaches:** lamp monitoring, light guides, gating an oscillator

## What to do

Click **Sim**. Close the lights switch. Then move the slide switch to "blown".

## What you should see

- Lights on, bulb OK: the lamp glows and the speaker is silent.
- Bulb blown: a warning tone of about 410 Hz.
- Lights off: everything is quiet.

## Why it works

The light from the lamp makes the phototransistor conduct, and it switches on a transistor that short-circuits the timing capacitor of the LM386 oscillator, so it cannot oscillate. Without light the transistor lets go and the oscillator runs. Because the light itself is checked, the alarm also catches a dirty or broken lamp, not just a broken wire.
