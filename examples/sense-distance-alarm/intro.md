---
level: intermediate
age: 11+
prereqs: [01-blink, 14-traffic-light]
teaches: [sensors, timing, nested-if]
---
## What you see
Three LEDs show how far away the nearest obstacle is: green when it is far, yellow when it is getting close, red when it is very close. The measured distance in centimetres also scrolls by on the serial monitor. Move the distance slider of the ultrasonic module and watch the zones change.

## Try this
1. Set the distance to 60 cm, then 35 cm, then 10 cm. Which LED lights each time?
2. Change the 20 and the 50 in the program. Make the red zone start at 30 cm.
3. Set the distance to 600 cm. What does the program print, and why?

## What is going on
The ultrasonic module is a tiny loudspeaker and microphone side by side. When the program asks for `distance from sonar`, the chip sends a short pulse to the module's TRIG pin. The module answers with a burst of sound far too high to hear, and then holds its ECHO pin high until the echo comes back. Sound travels about 343 metres per second, so a round trip to an obstacle 1 cm away and back takes 58 microseconds. The chip times the ECHO pulse and divides by 58 — that is the distance.

If nothing reflects the sound within 30 milliseconds (more than about 5 metres), the program gets 999: "nothing in range".

## Why it matters
Parking sensors, robot vacuum cleaners and automatic doors all measure distance this way. The trick of turning a time into a distance is everywhere — radar, sonar on ships, even measuring the distance to the Moon with a laser.

## Go further
- [14-traffic-light](../14-traffic-light) — the same three colours, driven by time instead of distance.
- [sense-thermometer-1wire](../sense-thermometer-1wire) — another sensor that answers in carefully timed pulses.
- Experiment: add a buzzer that beeps faster the closer the obstacle gets.
