# lab-hygrometer — expected behaviour

## Circuit
9 V, one LM324 quad op-amp. Section 2 buffers half the supply (10 kΩ / 10 kΩ) as a half-supply reference.
Section 1 is an inverting stage: a salt-film humidity comb from +9 V into its −IN, its +IN on the reference,
feedback 100 kΩ plus a 1 MΩ "gain" rheostat. A moving-coil meter (5 V full scale) runs from the
reference to the output. Sections 3 and 4 are parked as grounded followers.

## Observable behaviour
- The comb feeds a current of 4.5 V / R_comb into the stage; the output falls below the reference by
  that current times the feedback resistance, and the meter shows the difference.
- Room air (50 % RH, comb about 10 MΩ) with the gain knob at half (about 600 kΩ of feedback): the meter
  reads about 0.3 V. A few hundredths of a volt of that is the LM324's own input bias current (about 42 nA out of the − input) through the feedback resistance; it is there with the comb dry, too.
- The comb's conductance rises about tenfold every 12 % of humidity, so the reading climbs steeply: about
  two and a half times the room reading at 55 %, nearly seven times at 60 %. A little above 60 % the output reaches its lower limit near 0 V and the
  needle stops at about nine tenths of the scale.
- The gain knob chooses the range: at full gain the needle is already past
  two thirds of the scale at 60 %; at the lowest gain it barely moves there, reaches about two fifths of the
  scale at 70 % and hits its stop below 80 %.

## What this verifies
1. A resistive humidity sensor read as a current by an inverting op-amp stage: reading ∝ R_f / R_sensor.
2. The feedback resistor sets the sensitivity (gain).

```assert
# room air, gain knob at half
net lm324_3.1_pos V 4.50 +-0.03
net analog_meter_9.b V 4.23 +-0.05
```
