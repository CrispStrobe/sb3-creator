---
level: advanced
age: 14+
prereqs: [42-diode-rectifier, pc21-rc-smoothing]
teaches: [amplitude-modulation, envelope-detector, crystal-radio, rc-filter]
---
## What you see
Three signal sources stacked on top of each other form a small test transmitter: a 20 kHz carrier and two side frequencies just below and above it. Behind it sits the classic crystal-radio receiver: one diode, one capacitor, a resistor and an earphone.

## Try this
1. Put an oscilloscope probe on the transmitter output: a fast wave whose height rises and falls 500 times per second.
2. Probe after the diode and on the capacitor: the fast wave is gone, the slow 500 Hz tone remains.
3. Change the smoothing capacitor to 100 nF. The tone gets smeared, because the capacitor cannot empty fast enough.
4. Change it to 1 nF. Now a fast ripple rides on the tone.

## What is going on
A radio station cannot send sound directly; it varies the height (amplitude) of a fast carrier wave in step with the sound. Mathematically that is the same as sending the carrier plus two neighbouring frequencies, which is how this bench builds it. The diode lets only the positive half through. The capacitor charges to each peak and leaks a little through the resistor in between, so its voltage traces the outline of the peaks — the envelope, which is the original sound. The time constant must be long compared with one carrier cycle but short compared with one cycle of the sound.

## Go further
- [lab-applause-meter](../lab-applause-meter) — the same diode-and-capacitor trick with a much slower release.
- [pc21-rc-smoothing](../pc21-rc-smoothing) — RC smoothing on its own.
