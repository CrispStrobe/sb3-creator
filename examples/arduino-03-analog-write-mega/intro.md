---
level: intermediate
age: 10+
prereqs: [arduino-03-fading]
teaches: [pwm, mega-board, multiple-outputs]
---
## What you see
Three LEDs on the Arduino Mega fade in and out using PWM. The Mega has more PWM pins than the Uno, so this example drives multiple channels simultaneously.

## Try this
1. Run the program and watch three LEDs fade in sync.
2. Offset the starting brightness of each LED to create a wave effect.
3. Change the fade speed by adjusting the step size.

## What is going on
The program sweeps a brightness variable from 0 to 255 and back, applying it to each PWM pin. On the Mega, pins D2-D13 and D44-D46 all support PWM; the Uno only has D3, D5, D6, D9, D10, D11.

## Go further
- [arduino-03-fading](../arduino-03-fading) — single-LED fade on the Uno.
- [mega01-blink](../mega01-blink) — basic Mega blink.
