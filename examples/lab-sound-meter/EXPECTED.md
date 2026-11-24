# lab-sound-meter — expected behaviour

## Circuit
- 9 V. A magnetic earphone (`earphone_3`) is the microphone: a steady 1 kHz tone reaches it at the loudness of the **Sound** slider (90 dB SPL as loaded); its coil makes about 3 mV per pascal.
- Two transistor gain stages: Q1 (`npn_5`) with 10 kΩ load and 1 MΩ from collector to base (gain near 100), then Q2 (`npn_11`) on a 100 kΩ / 27 kΩ divider with 4.7 kΩ / 2.2 kΩ (gain about 2). 100 nF, 1 µF and 100 nF couple the stages.
- M: half the supply from 2.2 kΩ / 2.2 kΩ, held by 100 µF.
- One half of an LM358 (`lm358_19`) is the rectifier: its + input sits on the amplified signal, held to M by 100 kΩ. Its output drives a diode and the meter (1 mA movement, 47 µF across it as needle damping) into the − input, which 560 Ω returns to M. The second half is parked.

## Observable behaviour
- The loop forces (signal − M) / 560 Ω through the meter whenever the signal is above M, and nothing when it is below: half-wave rectification with no diode drop lost, so even small signals register.
- 90 dB (as loaded, once the bias has settled): about 0.46 mA.
- 80 dB: about a third of that (0.16 mA). 96 dB: about twice the 90 dB reading (0.94 mA), close to full scale.
- Silence: the needle falls back to zero.
- The reading is proportional to sound pressure, so every 10 dB is a factor of about three on the scale, and the useful range of one scale is about 20 dB.
- At switch-on the coupling capacitors and the 100 µF charge for a few tenths of a second; the needle kicks once and settles.

## What this verifies
1. A loudspeaker-style transducer turns sound pressure into a proportional voltage.
2. A diode inside an op-amp's feedback loop rectifies without a threshold.
3. The decibel scale is logarithmic: equal steps in dB are equal ratios on a linear meter.

```assert
# 1 ms after switch-on, coupling capacitors and the 100 µF still nearly
# empty: M only starting to rise, Q1 already biased by its own 1 MΩ, and the
# op-amp's − input following its + input
net resistor_15.b V 0.098 +-0.01
net npn_5.collector V 4.49 +-0.05
net lm358_19.1_pos V 3.057 +-0.03
net lm358_19.1_neg V 3.057 +-0.03
```
