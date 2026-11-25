# A staircase from charge packets

A clock tips one capacitor-full of charge into an op-amp integrator on every tick: its output climbs in equal steps. At the top a third op-amp empties it and the stairs start again. An LED gets brighter step by step.

**Teaches:** charge pump, integrator, comparator reset

## What to do

Click **Sim** and watch the green clock LED (led_10), the red LED (led_24) and the meter (analog_meter_25) for a few seconds.

## What you should see

- With each blink of the green LED the meter moves up one step of 0.7 V and the red LED gets a little brighter.
- After the fifth step the meter drops back below 1 V, the red LED goes dark and the climb starts again.

## Why it works

The step capacitor is charged to the clock's full swing and then emptied into the integrator through a diode, so each tick hands over the same charge. The integrator collects it in its own capacitor, so its output rises by the same amount every time. When the output reaches about 4.2 V the third op-amp pushes it back down quickly.
