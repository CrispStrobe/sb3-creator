# An LED switches a light: sensor LED on the amplifier chip

An LED works backwards: light falling on it drives a tiny current out of it. Here an ordinary red LED is the light sensor. An LM386 amplifier chip turns its fraction of a volt into volts, and a transistor uses them to switch a lamp on.

**Teaches:** LED as a photodiode, DC amplification with a power-amp chip, a set voltage as a switching threshold, transistor switch

## What to do

Click **Sim** and wait a moment for the amplifier to settle. Watch the voltmeter (voltmeter_8) on the amplifier output. Now slide the light on the sensor LED (led_3) slowly up from dark to full. Then park the light at the middle and turn LEVEL (potentiometer_6) down and up.

## What you should see

- In the dark the output rests at 0.9 V and the yellow lamp (led_13) is off.
- With more light the output climbs: 1 V more for every 0.05 V the sensor LED makes. At about a third of full light the lamp starts to glow; at 0.7 it is fully on.
- At half light: turn LEVEL down and the lamp is fully on; turn it up and the lamp goes out.

## Why it works

Inside the chip each input has 50 kΩ to ground, so the LED's few microamps become a fraction of a volt on the + input. The chip amplifies the difference between its two inputs 20 times, and its output rests at half the supply when they are equal. LEVEL puts a small voltage on the − input: until the light beats it, the output is held at the bottom. Above it, the output rises, and once it passes about 1.3 V the transistor starts to conduct and the lamp lights.
