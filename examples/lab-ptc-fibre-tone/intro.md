# A temperature sent as light, heard as a pitch

A temperature sensor's voltage, amplified by an amplifier chip, sets how brightly an LED shines into a light guide. At the far end a phototransistor feeds a two-transistor oscillator: the more light arrives, the higher it whistles. Warm the sensor and the pitch rises.

**Teaches:** analog transmission of a measured value, a light-controlled oscillator

## What to do

Click **Sim**. Set the PTC's surroundings to 25 °C, then to 45 °C, and listen to the piezo.

## What you should see

- 25 °C: a tone of about 540 Hz.
- 45 °C: the LM386's output rises, the LED shines brighter and the tone is higher.

## Why it works

The PTC sits under 22 kΩ, so its voltage rises a few millivolts per kelvin; the LM386 compares it with the set pot and multiplies the difference by 20, which sets the LED's current. At the far end, the phototransistor's current through 2.2 kΩ is the voltage the astable's base resistors charge from: more light, faster charging, higher pitch. The pitch also changes when the light guide loses light, which is the weakness the pulse-coded version avoids.
