# lab-amp-dc-gain — expected behaviour

## Circuit
- 9 V supply. LM386 (lm386_6), − input grounded.
- Input: 47 kΩ (resistor_3) from +9 V onto a 100 Ω INPUT pot (potentiometer_4) to ground; the wiper feeds the + input directly, 0 to 19 mV (as built: knob at half, 9.5 mV). A voltmeter (voltmeter_5) shows it.
- Gain pins 1 and 8: open, or bridged by 1 kΩ (switch_7), 220 Ω (switch_9), 47 Ω (switch_11) or a wire (switch_13).
- Output: a moving-coil meter (analog_meter_16, 3 V full scale, 50 µA movement = 20 kΩ/V) from the output to a 1 kΩ / 1 kΩ half-supply divider.

## Observable behaviour
- With the input at zero the meter reads zero: the output sits at half the supply.
- At 9.5 mV input the meter reads about 0.19 V with pins 1–8 open (gain 20), 0.38 V with 1 kΩ (gain 40), 0.82 V with 220 Ω (gain 86), 1.44 V with 47 Ω (gain 151) and 1.89 V with the wire (gain 198).
- Turning the input knob moves the reading in proportion, more steeply the higher the gain.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10d.test.mjs`: input 9.545 mV; meter 0.189, 0.383, 0.818, 1.437, 1.893 V (open, 1 kΩ, 220 Ω, 47 Ω, wire); 0.004 V with the input at zero.

## What this verifies
1. The amplifier's gain is set by what is wired between pins 1 and 8: 1 + 2·14.18 kΩ / (142.5 Ω + 1.35 kΩ ∥ R) in the chip's equivalent circuit, from 20 (open) to 200 (short). With 1 kΩ that is 41, with 220 Ω 87, with 47 Ω 152.
2. The gain holds at DC: a resistor (not a capacitor) across the gain pins raises the DC gain too.

## Simulation notes
The meter draws 60 kΩ from a divider of 500 Ω source resistance, so it reads about 1 % low against the bare formula. A capacitor across pins 1 and 8, as in most audio circuits, raises only the AC gain; at DC it stays 20.

```assert
# 1 ms after switch-on, knob at half, gain pins open
net lm386_6.inp V 0.0095 +-0.0005
net lm386_6.vout V 4.691 +-0.02
net analog_meter_16.b V 4.502 +-0.02
```
