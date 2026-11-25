# Transistor thermometer 0–100 °C with a relay thermostat

The voltage across a transistor's base-emitter junction drops by 2 mV for every degree it gets warmer. An op-amp turns that small change into a meter reading from 0 to 100 °C, and a second op-amp switches a heater through a relay whenever it is colder than you set.

**Teaches:** temperature sensing with a junction, calibration (zero and span), thermostat

## What to do

Click **Sim**. Read the meter. In the instruments column move the sensor's **Temperature** slider (ice, room, fingers, hot) and wait a few seconds each time. Turn **SET** to choose the thermostat temperature.

## What you should see

- Room (25 °C): the meter shows 25; the heater lamp is on because SET is at about 49 °C.
- Hot (70 °C): the meter climbs to 70 and the relay switches the heater off.

## Why it works

At a constant current a silicon junction needs less voltage the warmer it is: 2 mV less per degree. The op-amp subtracts this voltage from a fixed one (ZERO, set so 0 °C gives 0 V) and multiplies the difference by 25: 50 mV per degree, 5 V at 100 °C. The second op-amp compares that with SET and holds the relay in while the reading is lower.
