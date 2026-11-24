---
level: advanced
age: 14+
prereqs: [lab-pnp-npn-relax]
teaches: [relaxation-oscillator, tone-generator, sawtooth, pitch]
---
## What you see
The PNP-NPN flasher with a tiny 47 nF capacitor instead of an electrolytic, and a piezo earpiece where the LED used to be. A rheostat sets how fast the capacitor charges.

## Try this
1. Click **Sim** and listen: a buzzy tone.
2. Turn the rheostat. Which way makes the pitch go up?
3. Put a scope probe on the capacitor: the same sawtooth as the flasher, only a thousand times faster.
4. Move the probe to the piezo. It sees nothing while the capacitor charges and a short spike each time the pair fires.

## What is going on
Nothing about the circuit has changed except the size of the capacitor. It still charges through the resistors until it passes the PNP's base voltage, the pair fires and empties it in a short pulse, and the charging starts over. With a capacitor a hundred times smaller every cycle is a hundred times shorter, and a few hundred clicks a second blur into a tone. Less resistance means faster charging and a higher pitch. The sharp pulses give the tone its rough, buzzing sound: a sawtooth carries many overtones.

## Go further
- [lab-battery-monitor](../lab-battery-monitor) — the same pair as a battery monitor with an adjustable set point.
- [lab-astable-tone](../lab-astable-tone) — a tone from the two-transistor astable.
