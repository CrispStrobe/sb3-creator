# 74-ammeter — expected behaviour

## Circuit

- VCC → 1 kΩ rheostat (the variable load) → 10 Ω shunt → GND.
- MCU analog pin taps the load/shunt junction: it measures the voltage
  ACROSS the shunt, which is proportional to the current through it.
- I2C character LCD (PCF8574 backpack) on SDA/SCL.

## Program

Every 200 ms, the program converts the ADC result to whole shunt millivolts. The display resolution is 0.1 mA, one millivolt across the 10 Ω shunt. The LCD shows milliamps to one decimal place.

## Observable behaviour

- Rheostat at max resistance (~1010 Ω total): ~5 mA, shunt drop ~50 mV.
- Rheostat at minimum (1 Ω plus the 10 Ω shunt): about 455 mA with about 4.55 V across the shunt. The voltage lost across the shunt is the meter’s burden voltage.
- Moving the rheostat moves the mA reading the same direction within
  one refresh.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
