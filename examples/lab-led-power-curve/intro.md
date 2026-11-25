# How much light does an LED give per milliampere?

Turn the current through an LED up and down and measure how much light comes out. A photodiode with an op-amp acts as a light meter.

**Teaches:** light output against current, measuring light with a photodiode, colour sensitivity

## What to do

Click **Sim**. Turn the potentiometer and read the ammeter (LED current) and the voltmeter (light). Then use the slide switch to try the green LED at the same settings.

## What you should see

- Red LED: about 0.2 V on the voltmeter for every milliampere, from 1.5 mA up to 31 mA. Twice the current, twice the reading.
- Green LED: only about a quarter of that at the same current.

## Why it works

Every electron that crosses the LED's junction can turn into one photon, so the number of photons per second, the light, follows the current. The photodiode does the reverse: every photon it catches makes one electron of current. The green LED here converts current into light less efficiently, and silicon photodiodes are less sensitive to green than to red. Your eye is the opposite: it is most sensitive to green, which is why a green LED can look bright even though it radiates little power.
