---
level: advanced
age: 16+
prereqs: [43-rc-timing]
teaches: [low-pass-filter, frequency-response, scope-reading]
---
## What you see
An RC low-pass filter driven by a signal source, with the input and output both displayed on the oscilloscope. At low frequencies, the output follows the input closely. At high frequencies, the output is attenuated — the capacitor cannot charge and discharge fast enough to keep up.

## Try this
1. Set the input to a low frequency and confirm the output amplitude nearly matches the input.
2. Increase the frequency until the output drops to about 70% of the input — that is the cutoff frequency (fc = 1 / (2 * pi * R * C)).
3. Push the frequency much higher and observe the output almost disappearing — the filter is rejecting the signal.

## What is going on
An RC low-pass filter passes low-frequency signals and attenuates high-frequency ones. At low frequencies, the capacitor has time to charge fully each cycle, so the output voltage follows the input. At high frequencies, the capacitor barely charges before the input reverses, so the output voltage stays small. The cutoff frequency is where the output drops to 1/sqrt(2) (about 70.7%) of the input, corresponding to a 3 dB loss. Above the cutoff, attenuation increases at 20 dB per decade — each tenfold frequency increase reduces the output by a factor of ten.

## Why it matters
Filters are everywhere — in audio equalizers, anti-aliasing circuits before ADCs, power supply smoothing, and radio receivers. The RC low-pass is the simplest filter and the building block for understanding all higher-order designs.

## Go further
- [51-555-astable](../51-555-astable) — see RC timing used in a different context, setting the frequency of an oscillator.
- [49-function-generator-sine](../49-function-generator-sine) — understand the signal source driving this filter.
- Experiment: calculate the cutoff frequency for your R and C values, set the generator to that frequency, and verify the output is at 70.7% of the input.
