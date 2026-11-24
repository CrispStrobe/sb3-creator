# lab-led-heat-light — expected behaviour

## Circuit
- 9 V battery. A slide switch connects a 100 Ω heater resistor (0.81 W) to the battery; it is off as authored.
- Link A: red LED 1 (470 Ω) 3 cm from phototransistor 1 (emitter follower into 2.2 kΩ, voltmeter 1). LED 1 is taped to the heater (thermal model: `heatedBy` the heater, coupling 0.9).
- Link B: red LED 2 (470 Ω) 3 cm from phototransistor 2 (2.2 kΩ, voltmeter 2). Here phototransistor 2 is taped to the heater.
- The parts' thermal time constants are 1.5 s, so the bench warms in seconds.

## Observable behaviour
- Heater off: both meters read about 1.50 V.
- Heater on, after 5 s: meter 1 falls to about 0.84 V (LED 1 is near 70 °C and gives a good deal less light), meter 2 rises to about 1.83 V (phototransistor 2 is more sensitive warm).
- Heater off again: both drift back.

## What this verifies
1. An LED's light output falls as it warms (red LEDs by about 1 % per kelvin).
2. A phototransistor's sensitivity rises with temperature.
3. Why light sensors and emitters in a measurement need a steady temperature.

```assert
# Heater off: both links read alike.
net voltmeter_9.a V 1.50 +-0.03
net voltmeter_14.a V 1.50 +-0.03
```
