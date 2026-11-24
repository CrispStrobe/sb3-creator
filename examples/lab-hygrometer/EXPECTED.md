# lab-hygrometer — expected behaviour

## Circuit
9 V, one LM324 quad op-amp. Section 2 buffers half the supply (10 kΩ / 10 kΩ) as a 4.5 V reference.
Section 1 is an inverting stage: a salt-film humidity comb from +9 V into its −IN, its +IN on the reference,
feedback 100 kΩ plus a 1 MΩ "gain" rheostat. A 5 V moving-coil meter (100 µA full scale) runs from the
reference to the output. Sections 3 and 4 are parked as grounded followers.

## Observable behaviour
- The comb feeds a current of 4.5 V / R_comb into the stage; the output falls below the reference by
  that current times the feedback resistance, and the meter shows the difference.
- Room air (50 % RH, comb about 10 MΩ) with the gain knob at half (about 600 kΩ of feedback): the meter
  reads about 0.27 V.
- The comb's conductance rises about tenfold every 12 % of humidity, so the reading climbs steeply: about
  0.7 V at 55 %, 1.8 V at 60 %. A little above 60 % the output reaches its lower limit near 0 V and the
  needle stops at about nine tenths of the scale.
- The gain knob chooses the range: at full gain the meter already reads 3.4 V at 60 %; at the lowest gain it
  reads only 0.3 V there, about 2.1 V at 70 %, and hits its stop below 80 %.

## What this verifies
1. A resistive humidity sensor read as a current by an inverting op-amp stage: reading ∝ R_f / R_sensor.
2. The feedback resistor sets the sensitivity (gain).

```assert
# room air, gain knob at half
net lm324_3.1_pos V 4.50 +-0.03
net analog_meter_9.b V 4.23 +-0.05
```
