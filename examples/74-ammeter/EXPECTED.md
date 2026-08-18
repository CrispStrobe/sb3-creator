# 74-ammeter — expected behaviour

## Circuit

- VCC → 1 kΩ rheostat (the variable load) → 10 Ω shunt → GND.
- MCU analog pin taps the load/shunt junction: it measures the voltage
  ACROSS the shunt, which is proportional to the current through it.
- I2C character LCD (PCF8574 backpack) on SDA/SCL.

## Program

Every 200 ms: read the ADC, convert to shunt millivolts, divide by the
10 Ω shunt to get milliamps (`ma = mv / 10`), print to the LCD.

## Observable behaviour

- Rheostat at max resistance (~1010 Ω total): ~5 mA, shunt drop ~50 mV.
- Rheostat at min (~10 Ω total): ~500 mA (clamped by the model), shunt
  drop ~5 V — the reading rails; real meters pick a smaller shunt for
  exactly this reason, which the intro explains (burden voltage).
- Moving the rheostat moves the mA reading the same direction within
  one refresh.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
