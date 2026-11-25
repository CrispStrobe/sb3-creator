# lab-radio-level — expected behaviour

## Circuit
- The front end of lab-crystal-set: antenna on the ferrite coil's tap, tuning capacitor (`tuning_cap_6`, at 0.50 as loaded) across the coil, germanium detector into 47 kΩ ‖ 2.2 nF, and a crystal earphone to listen. It hears the simulator's standard broadcast; 0.50 is the strong 612 kHz station with its 400 Hz tone.
- 9 V, one LM324 (`lm324_14`). The detected audio goes through 47 nF to section 1's + input, held at half supply by 100 kΩ / 100 kΩ. 100 kΩ from the output and 4.7 kΩ to a second half-supply divider (10 kΩ / 10 kΩ) make it an amplifier of about 11.
- Two germanium diodes and 1 µF pump the amplified audio into the level L (1 µF, 47 kΩ bleed). A moving-coil meter (5 V full scale, 100 µA movement) reads L.
- Sections 2, 3 and 4 are comparators: + input on L, − input on the taps of a 62k / 5.6k / 5.6k / 13k ladder from 9 V (about 1.36, 1.94 and 2.53 V). Their outputs light green, yellow and red through 1 kΩ.

## Observable behaviour
- Tuned to the local station: within about 12 ms the level stands near 3 V on the meter (it ripples with the tone); green and yellow are lit steadily and red for most of the time.
- Tuned between stations (0.38): the level drains away and all three LEDs go dark within a few tens of milliseconds.
- The earphone keeps playing the station all the while: the indicator listens alongside it.

## What this verifies
1. The audio from a crystal set is large enough to drive an op-amp level indicator.
2. A diode pump turns AC into a DC level that a meter and comparators can show.
3. Comparators on a resistor ladder make a bar display: each lights when the level passes its own tap.

```assert
# 1 ms after switch-on: the tank's top sits at ground for DC (the coil
# shorts it); the ladder taps; the amplifier output still on its floor and
# the level still empty
net tuning_cap_6.a V 0.00 +-0.01
net lm324_14.2_neg V 1.357 +-0.005
net lm324_14.4_neg V 2.527 +-0.005
net lm324_14.1_out V 0.007 +-0.01
net capacitor_22.a V 0.00 +-0.01
```
