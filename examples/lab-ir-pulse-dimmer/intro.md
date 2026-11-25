# Pulsed infrared and a wireless dimmer

A transmitter that only flashes briefly saves battery. And if the flashes get longer, a receiver that averages them sees more light: the flash length becomes a dimmer setting.

**Teaches:** pulse width, duty cycle, integrating receiver

## What to do

Click **Sim**. Turn the knob from 0.2 to 0.8 and watch the green LED at the receiver.

## What you should see

- Short flashes: green dark, and the transmitter draws little.
- Long flashes: green lit.

## Why it works

Two diodes give the timing capacitor separate charge and discharge paths, and the knob shares its track between them: the period stays roughly the same while the 'on' part grows. At the receiver each flash pushes charge into a capacitor that leaks between flashes, so its voltage follows how much of the time the light was on.
