# Remote control by light: a dimmer and a motor switch

A remote control that uses light: the transmitter flashes an LED, and how long each flash lasts decides how bright an LED at the far end glows, or whether a motor runs. No wire connects them.

**Teaches:** pulse-width (duty-cycle) control, optical links, averaging

## What to do

Click **Sim**. Close the transmitter switch. Turn the duty potentiometer and watch the far green LED. Then move the slide switch to the motor and switch the transmitter off and on.

## What you should see

- The far LED looks brighter or dimmer as you turn the duty pot.
- On the motor position the motor runs while the transmitter is on and coasts to a stop when it is switched off.

## Why it works

The astable flashes about 700 times a second. The pot changes how the time is shared between "on" and "off" without changing the rate much. At the far end the LM386 switches the load fully on during each flash and off between them, so the load gets the same share of time. Your eye and the motor's inertia average the pulses, so the share appears as brightness or speed. This is pulse-width control, the way dimmers and motor speed controllers work.
