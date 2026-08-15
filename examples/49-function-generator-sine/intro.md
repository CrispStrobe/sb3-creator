---
level: intermediate
age: 12+
prereqs: [43-rc-timing]
teaches: [sine-wave, function-generator, ac-signals]
---
## What you see
A function generator producing a sine wave, visible on the oscilloscope. The smooth, continuous waveform swings symmetrically above and below zero — the fundamental shape of alternating current. Frequency and amplitude are adjustable.

## Try this
1. Run the simulation and observe the sine wave on the scope — note its frequency and amplitude.
2. Double the frequency and watch the wave compress horizontally — more cycles fit on the screen.
3. Reduce the amplitude and observe the wave shrink vertically while keeping its shape.

## What is going on
A function generator creates repeating electrical signals with a precise shape. The sine wave is the most fundamental: it represents a single frequency with no harmonics. Every other periodic waveform (square, triangle, sawtooth) can be built by adding sine waves of different frequencies — this is Fourier's theorem. The scope displays voltage on the vertical axis and time on the horizontal, letting you measure period (T), frequency (f = 1/T), and peak voltage directly.

## Why it matters
Sine waves are the language of signal analysis. Understanding them is the gateway to audio, radio, filtering, and power systems. A function generator and oscilloscope together are the most important bench instruments after a power supply.

## Go further
- [50-rc-scope](../50-rc-scope) — feed this sine wave through an RC filter and see how the circuit attenuates high frequencies.
- [43-rc-timing](../43-rc-timing) — understand the RC time constant that determines a filter's cutoff frequency.
- Experiment: switch the generator to a square wave and use the scope to measure the rise time — compare it to the sine wave's smooth transitions.
