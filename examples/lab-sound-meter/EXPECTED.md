# lab-sound-meter — expected behaviour

## Circuit
- 9 V, one LM324 (`lm324_3`). Section 4 buffers half the supply (M) from 10 kΩ / 10 kΩ.
- A magnetic earphone (`earphone_6`) is the microphone, between section 1's + input and M: a steady 1 kHz tone reaches it at the loudness of the **Sound** slider (90 dB SPL as loaded); its coil makes about 3 mV per pascal.
- Two gain stages: sections 1 and 2 as non-inverting amplifiers around M, 100 kΩ back and 4.7 kΩ (×22) or 10 kΩ (×11) with 10 µF to M, so their DC gain stays one.
- Section 3 is the rectifier: + input on the amplified signal; its output drives a diode and the meter (1 mA movement, 47 µF across it as needle damping) into the − input, which 560 Ω returns to M.

## Observable behaviour
- The loop forces (signal − M) / 560 Ω through the meter whenever the signal is above M, and nothing when it is below: half-wave rectification with no diode drop lost, so even small signals register.
- 90 dB (as loaded): about 0.35 mA.
- 80 dB: about a third of that (0.12 mA). 96 dB: about twice the 90 dB reading (0.71 mA).
- Silence: the needle falls back to zero within a few tens of milliseconds.
- The reading is proportional to sound pressure, so every 10 dB is a factor of about three on the scale, and the useful range of one scale is about 20 dB.

## What this verifies
1. A magnetic transducer turns sound pressure into a proportional voltage.
2. A diode inside an op-amp's feedback loop rectifies without a threshold.
3. The decibel scale is logarithmic: equal steps in dB are equal ratios on a linear meter.

```assert
# 1 ms after switch-on: M buffered at half supply, and the rectifier's −
# input sitting on M while the signal is still small
net lm324_3.4_out V 4.500 +-0.005
net lm324_3.3_neg V 4.500 +-0.01
```
