# Siren and canary: a slow ramp sweeps a tone

A siren's pitch climbs and falls; a canary chirps up again and again. Both are one tone generator whose pitch is pushed around by a much slower oscillator.

**Teaches:** voltage-controlled oscillator, modulation, ramp and sawtooth

## What to do

Click **Sim** and listen. Then slide **MODE** to canary. **SOUND** turns the tone off and on.

## What you should see

- Siren: the tone glides up and down, about one and a half times a second.
- Canary: quick upward chirps, each starting from the bottom again.

## Why it works

A slow op-amp oscillator charges and discharges a big capacitor; its voltage is a slow ramp. A second op-amp stretches it and feeds it to the base resistors of a transistor multivibrator, the tone generator. The higher that voltage, the faster the multivibrator's capacitors recover after each switch, and the higher the tone. In canary mode a diode empties the slow capacitor almost at once, so the ramp only ever rises: a chirp.
