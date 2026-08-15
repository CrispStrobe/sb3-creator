---
level: beginner
age: 12+
prereqs: [pc26-motor-clamp]
teaches: [motor-indicator, status-led, parallel-indicator]
---
## What you see
A motor controlled by a switch, with an LED wired in parallel as a run indicator. When the motor runs, the LED lights up to show it is active. When the motor stops, the LED goes dark.

## Try this
1. Close the switch and observe both the motor spinning and the LED lighting.
2. Open the switch and confirm both the motor and the LED stop together.
3. Try covering the LED and notice the motor still runs — the indicator does not affect the motor.

## What is going on
The LED and its current-limiting resistor are connected in parallel with the motor. When the switch closes, current flows through both paths: the motor draws its operating current, and a small amount flows through the resistor and LED. The LED's current is tiny compared to the motor's, so it does not affect motor performance. The resistor limits the LED current to a safe level — without it, the LED would be destroyed by the supply voltage.

## Why it matters
Status indicators are essential in any system where a motor or actuator is not directly visible. Industrial equipment, enclosed fans, pumps behind walls — all need a way to confirm they are running. A parallel LED is the cheapest and most reliable indicator, and it requires no additional control logic.

## Go further
- [pc26-motor-clamp](../pc26-motor-clamp) — motor protection with a freewheel diode.
- [pc53-buzzer-switch](../pc53-buzzer-switch) — another simple switched output device.
- Experiment: add a second LED in a different color that lights when the motor is off (using an inverter or a second circuit path) to create a run/stop indicator pair.
