---
level: advanced
age: 14+
prereqs: [lab-bridge-meter]
teaches: [microphone, amplifier, precision-rectifier, decibel]
---
## What you see
A magnetic earphone used as a microphone and one quad op-amp: two sections amplify, one rectifies with a diode and the meter in its feedback path, and one holds half the supply as the reference.

## Try this
1. Click **Sim**. A steady tone at 90 dB reaches the microphone and the needle stands at about a third of the scale.
2. In the instruments column pull the **Sound** slider to 80: the needle drops to about a third.
3. Push it to 96: about two thirds of the scale. Six decibels more doubled the reading.
4. Set it to 0: the needle falls back to rest.

## What is going on
The earphone's coil makes a few millivolts from the sound. The two amplifier sections raise that by about 240 times, to half a volt or so. A plain diode would ignore everything below about 0.6 V, but here the diode sits inside the op-amp's feedback loop: the op-amp drives its output as far as it takes to push the current (signal minus half supply, divided by the 560 Ω resistor) through the diode and the meter. So the meter carries exactly the positive half-waves, however small. The capacitor across it lets the needle show their average. The meter is linear in sound pressure, but our ears and the decibel scale are logarithmic: every 20 dB is ten times the pressure, which is why one meter scale only covers about 20 dB.

## Go further
- [lab-bridge-meter](../lab-bridge-meter) — the full-wave version with a bridge in the loop.
- [lab-ring-relay](../lab-ring-relay) — a loudspeaker hearing a telephone bell.
