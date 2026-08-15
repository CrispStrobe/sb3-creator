---
level: beginner
age: 10+
prereqs: [arduino-01-blink]
teaches: [pwm, analog-output, led-brightness]
---
## What you see
An LED on pin D9 fades smoothly from off to full brightness and back, over and over. The brightness changes in small steps every 30 ms.

## Try this
1. Run the program and watch the LED breathe.
2. Change the fadeAmount from 5 to 1 — the fade becomes smoother but slower.
3. Change pin D9 to D3 or D11 (other PWM pins) and verify it still works.

## What is going on
The Arduino cannot output a true analog voltage, but it can switch pin D9 on and off very fast — thousands of times per second. By varying the fraction of time the pin is HIGH (the **duty cycle**), the LED appears dimmer or brighter. This technique is called PWM (Pulse Width Modulation). analogWrite(pin, 0) is always off, analogWrite(pin, 255) is always on, and values in between give proportional brightness.

## Why it matters
PWM is how microcontrollers control brightness, motor speed, and servo position — any application where you need a value between fully on and fully off.

## Go further
- [arduino-01-analog-read-serial](../arduino-01-analog-read-serial) — read a potentiometer to control things.
- Experiment: use a potentiometer to control the fade speed.
