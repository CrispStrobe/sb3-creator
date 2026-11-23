# Feeling the wind: a self-heated sensor

A small heater keeps a temperature sensor a little warmer than the room. When air moves past, it carries heat away and the sensor cools down, even though the air itself is no colder. Measure that cooling and you are measuring the wind.

**Teaches:** hot-wire anemometer, thermal coupling, bridge circuits, comparators, thermostat

## What to do

Click **Sim** and wait about ten seconds while the sensor warms up and the red LED goes out. Then set the airflow to 2 m/s. Set it back to 0, and raise the room temperature to 32 °C.

## What you should see

- Still air: the meter near zero, no alarm.
- Airflow: the meter rises and the DRAUGHT LED lights.
- Warm room: the fan switches on.

## Why it works

The heater and the thermistor sit together. In still air they reach a balance between the heat put in and the heat lost to the air. Moving air removes heat faster, so the balance settles lower. The thermistor's resistance follows its temperature, the bridge turns that into a voltage, and the comparators decide when it is too cool (draught) or too warm (fan on). Real airflow meters in cars work with the same idea.
