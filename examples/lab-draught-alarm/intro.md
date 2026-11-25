# Draught alarm: a self-heated PTC, an LM386 bridge detector and a blinker

A small silicon PTC sensor carries enough current to warm itself above the room. Moving air carries that heat away, the sensor cools, and an LM386 notices the change in its resistance and starts a blinker.

**Teaches:** self-heating, heat transfer by moving air, bridge circuits, the LM386 as a comparator, the astable blinker

## What to do

Click **Sim** and wait about five seconds while the sensor warms up and the blinking stops. Then set the airflow to 2 m/s. After a few seconds set it back to 0.

## What you should see

- While it warms up: the LEDs blink.
- Still air: dark.
- Airflow 2 m/s: after about a second the two LEDs blink alternately.
- Airflow back to 0: a few seconds later they stop.

## Why it works

The sensor heats itself with its own current until the heat it makes is carried away as fast as it is made, about 25 °C above the room. Moving air carries heat away faster, so the balance settles lower. A PTC's resistance falls as it cools, which raises the voltage on the 330 Ω resistor below it. The LM386 compares that with the voltage from the pot; once it is higher, the output goes high and powers the two-transistor blinker.
