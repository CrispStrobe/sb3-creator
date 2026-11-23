# lab-attenuator-gain — expected behaviour

## Circuit
A big signal, a divider that shrinks it, and an amplifier that grows it again.

- **Tone source:** a function generator, 440 Hz sine of 4 V peak behind its own small output resistance (standing in for a transistor oscillator, which also swings several volts).
- **Attenuator:** R_series = 220 kΩ from the source to the amplifier input, R_shunt = 220 Ω from there to ground. The BYPASS switch shorts R_series.
- **Amplifier:** half 1 of an LM358 on a split supply (two 9 V sources in series, junction = ground) as a non-inverting amplifier: R_f = 100 kΩ from the output to the inverting input, and the GAIN slide switch connects that input to ground through R_g = 1 kΩ (position a) or R_g = 100 Ω (position b).
- **Output:** a piezo from the amplifier output to ground. Half 2 of the LM358 is parked as a grounded follower.

There is no dedicated audio power-amplifier chip in the parts box; the op-amp with its feedback resistors plays that role, and R_g is its "gain-set" resistor.

## Observable behaviour
- **The divider:** 220 Ω / (220 kΩ + 220 Ω) is almost exactly 1/1000. The 4 V peak sine arrives at the amplifier as 4 mV peak.
- **Gain = 1 + R_f / R_g:** 101 with R_g = 1 kΩ, 1001 with R_g = 100 Ω.

| Setting | amplifier input | amplifier output |
|---|---|---|
| attenuator in, R_g = 1 kΩ (start) | ±4 mV | ±0.40 V clean sine, quiet |
| attenuator in, R_g = 100 Ω | ±4 mV | about ±3.6 V clean sine, loud |
| BYPASS closed, R_g = 1 kΩ | ±3.3 V | clipped: flat at +7.49 V and −8.99 V |

- **Bandwidth:** an LM358 has a gain-bandwidth product of about 1 MHz. At a gain of 1001 that leaves roughly 1 kHz of bandwidth, so at 440 Hz the gain has already dropped to about 1001 / √(1 + 0.44²) ≈ 916: the output reaches about ±3.6 V, not the ±4.0 V the resistor ratio promises. At a gain of 101 the bandwidth is about 10 kHz and 440 Hz passes almost untouched.
- **Clipping:** with the attenuator bypassed the generator's output resistance and R_shunt form the only divider left, so about ±3.3 V reaches the input and the amplifier is asked for ±330 V. It can only go as far as its supply allows: the LM358 stops about 1.5 V below the positive rail and almost at the negative one. The tops and bottoms of the sine are sliced off, which turns a soft tone into a harsh, buzzing one.
- **Snapshot at 1 ms:** the source is at 1.47 V, the amplifier input at 1.47 mV and the output at 0.156 V: gain 101, read a few degrees of phase late because the output lags the input slightly.

## What this verifies
1. A voltage divider is an attenuator: the ratio of two resistors sets how much of a signal gets through.
2. Negative feedback sets the gain; the output can never exceed what the supply allows, and asking for more clips the signal.

```assert
# t = 1 ms, attenuator in, R_g = 1 kOhm
net tone.out V 1.47 +-0.02
net u1.1_out V 0.156 +-0.005
```
