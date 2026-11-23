# lab-airflow-sensor — expected behaviour

## Circuit
- 9 V supply. A 470 Ω heater resistor (rth 200 K/W) sits next to an NTC thermistor (10 kΩ at 25 °C, beta 3950, coupling 0.8 to the heater). Both have a thermal time constant of 2 s in still air.
- The NTC over 6.8 kΩ gives the sensor voltage S: a warmer NTC has less resistance, so S rises.
- A 1 kΩ "zero" pot is the other half of a bridge. A moving-coil meter (2 V full scale) reads zero pot minus S.
- LM358 half 1: DRAUGHT alarm. The red LED lights while S is below the alarm pot (5.94 V).
- LM358 half 2: thermostat. Above the thermostat pot (6.39 V) it switches an NPN that runs a small fan motor; a diode across the motor catches its kick when the NPN turns off. The fan blows on the sensor: every rad/s of fan speed adds 0.01 m/s of air (`airflowGain`).
- Airflow and room temperature are world settings (airflow in m/s, temperature in °C).

## Observable behaviour
- Power-on: everything is at room temperature, S is only about 4.1 V, and the alarm lights until the sensor has warmed up.
- After about 10 s in still air the heater runs about 34 K above the room and the NTC settles about 28 K above it; S is about 6.1 V, the alarm is off and the meter is near zero.
- Air at 2 m/s: forced convection carries heat away, the NTC cools to about 37 °C, S falls to about 5.0 V, the meter swings up and the DRAUGHT LED lights. Stronger air gives a larger reading, but less and less per extra m/s.
- Room at 32 °C, still air: the whole sensor is 7 K warmer, S rises above the thermostat setting and the fan starts. Its own air (up to about 0.23 m/s) cools the sensor back below the setting before it reaches full speed, so it stops again: the thermostat cycles the fan every two to three seconds and holds S between about 6.35 and 6.40 V. The fan's air is far too weak to trip the draught alarm.
- Without the fan's air the sensor would climb to about 6.6 V and the fan would run without stopping.

```assert
# power-on, still cold: sensor low, alarm lit, fan off
net ntc_4.b V 4.07 +-0.03
net potentiometer_8.wiper V 5.94 +-0.02
net potentiometer_12.wiper V 6.39 +-0.02
net lm358_9.2_out V 0.00 +-0.05
```
