# Humidity switch with a 555

Breathe on the sensor and the light changes from green to blue. It only changes back once the sensor has dried well below the point where it switched on: exactly what a humidifier controller needs so it does not click on and off all the time.

**Teaches:** Schmitt trigger, hysteresis, humidity sensor

## What to do

Click **Sim**. The green DRY LED is lit. Drag the humidity slider of the sensor comb (humidity_comb_3) up to about 90 % (a breath): the blue WET LED lights. Now bring it slowly back down. Watch where it switches back, then go up again slowly and watch where it switches on.

## What you should see

- Room air (50 %): green DRY LED on.
- Breath (90 %): blue WET LED on.
- At 74 % the LED keeps whatever it was showing; below about 70 % it is DRY, above about 77 % it is WET.

## Why it works

The sensor's salt film conducts better the more water it takes from the air, so the voltage on the 555's input rises with humidity. The 555 switches its output low when the input passes 6 V and only switches it back high when the input has fallen below 3 V. In between it remembers.
