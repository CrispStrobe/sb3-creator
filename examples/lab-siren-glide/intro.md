---
level: intermediate
age: 12+
prereqs: [pc68-555-sirene, pc06-rc-charge]
teaches: [voltage-controlled-oscillator, RC-envelope, 555-timer, siren]
---
## What you see
Press and hold SIREN: after a short pause a note appears, swoops upwards and settles high. Let go: it slides down and fades into silence. That wail comes from one capacitor slowly charging and discharging.

## Try this
1. Hold SIREN for about two seconds, then let go. Listen (or watch the scope) for the rise, the steady top and the fall.
2. Tap SIREN briefly. The note only gets halfway up before it sinks again.
3. Probe C_glide with the voltmeter while you play. Note the voltage where the tone starts and stops: it is about 6 V both ways.

## What is going on
The 555 flips when its timing capacitor reaches 6 V, two thirds of its supply. Normally that capacitor charges from 9 V. Here it charges from the glide capacitor instead, whose voltage rises while you hold the button and falls when you let go. If the glide voltage is below 6 V the timing capacitor can never reach the threshold, so there is no sound. A little above 6 V it gets there slowly (low note); far above, it gets there quickly (high note). So the pitch follows the glide voltage: a voltage-controlled oscillator, with the button and capacitor shaping the swoop.

## Go further
- [pc68-555-sirene](../pc68-555-sirene): a siren whose pitch you set by hand with a pot.
- [lab-struck-note](../lab-struck-note): a capacitor shaping loudness instead of pitch.
