# Astable coupled by light

A blinker made of one transistor and one phototransistor: one of the two connections between them is not a wire at all but a beam of infrared light.

**Teaches:** optocoupler principle, astable multivibrator

## What to do

Click **Sim** and watch the green and red LEDs. Then move the receiver away with the light path's **knob**.

## What you should see

- Green and red take turns, a few times a second.
- Far enough away, the light is too weak and the blinking stops.

## Why it works

In an ordinary blinker each transistor switches the other off through a capacitor. Here Q1 switches the LED off through a capacitor, and the LED switches the phototransistor through its light. When the light comes back, the phototransistor switches Q1 off through the other capacitor. Each capacitor's recharging decides how long each half lasts.
