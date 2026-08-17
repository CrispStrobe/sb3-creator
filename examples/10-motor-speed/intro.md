---
level: intermediate
age: 12+
prereqs: [09-relay-clicker, 02-dimmer]
teaches: [motor-control, darlington, pwm]
---
## What you see
A DC motor spins faster or slower as you turn the potentiometer. The MCU reads the pot via ADC and drives the motor through a TIP120 Darlington transistor with PWM. A flyback diode protects the transistor from the motor's inductive kickback. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Run the program and turn the potentiometer — the motor speeds up and slows down smoothly.
2. Set the pot to its lowest position and confirm the motor stops completely.
3. Disconnect the flyback diode and notice the voltage spikes that appear when PWM switches the motor off.

## What is going on
This combines two earlier ideas: the ADC-to-PWM conversion from [02-dimmer](../02-dimmer) and the transistor driver from [09-relay-clicker](../09-relay-clicker). The TIP120 is a Darlington pair — two transistors in one package — that can handle the motor's current (up to 5 A) while being driven directly from an MCU pin. The PWM duty cycle controls the average voltage the motor sees, which controls its speed. The flyback diode across the motor shorts the inductive voltage spike that occurs every time the PWM signal turns off, protecting the TIP120.

## Why it matters
Variable-speed motor control is used in fans, pumps, robots, and conveyor belts. The pattern — sensor reads a setpoint, MCU applies PWM through a power transistor — is the same whether the motor is 5 V or 24 V. Understanding it here means you can scale it to real applications.

## Go further
- [02-dimmer](../02-dimmer) — the simpler pot-to-PWM version with just an LED.
- [09-relay-clicker](../09-relay-clicker) — on/off motor control without speed variation.
- Experiment: add a second pot to set a minimum speed, so the motor never drops below a crawl.
