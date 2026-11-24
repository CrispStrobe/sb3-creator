# lab-radio-level — expected behaviour

## Circuit
- The front end of lab-crystal-set: antenna on the ferrite coil's tap, tuning capacitor (`tuning_cap_6`, at 0.50 as loaded) across the coil, germanium detector into 47 kΩ ‖ 2.2 nF, and a crystal earphone to listen. It hears the simulator's standard broadcast; 0.50 is the strong 612 kHz station with its 400 Hz tone.
- 9 V. The detected audio goes through 47 nF to the + input of one half of an LM358 (`lm358_14`), held at half supply by 100 kΩ / 100 kΩ. 100 kΩ from the output and 4.7 kΩ to a second half-supply divider (10 kΩ / 10 kΩ) make it an amplifier of about 11. The second half is parked.
- Two germanium diodes and 1 µF pump the amplified audio into the level L (1 µF, 47 kΩ bleed). A moving-coil meter (5 V full scale, 100 µA movement) reads L.
- An NPN emitter follower (`npn_25`, 4.7 kΩ) copies L one junction lower without loading it. Three NPN stages on dividers from it (150 Ω, 1 kΩ, 1.6 kΩ over 1 kΩ) light green, yellow and red.

## Observable behaviour
- Tuned to the local station: within about 12 ms the level stands near 2.6 V on the meter (it ripples between about 2.2 and 2.9 V with the tone); green and yellow are lit steadily and red flickers on the louder moments.
- Tuned between stations (0.38): the level drains away and all three LEDs go dark within a few tens of milliseconds.
- The earphone keeps playing the station all the while: the indicator listens alongside it.

## What this verifies
1. The audio from a crystal set is large enough to drive a one-op-amp level indicator.
2. A diode pump turns AC into a DC level that a meter and threshold stages can show.
3. An emitter follower lets low-impedance loads watch a high-impedance node.

```assert
# 1 ms after switch-on: the tank's top sits at ground for DC (the coil
# shorts it); the amplifier has not settled yet (its + input still charging
# through 47 nF, the output on its floor) and the level is still empty
net tuning_cap_6.a V 0.00 +-0.01
net lm358_14.1_out V 0.007 +-0.01
net resistor_17.b V 4.295 +-0.05
net capacitor_22.a V 0.00 +-0.01
```
