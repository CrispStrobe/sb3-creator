---
level: intermediate
age: 12+
prereqs: [37-voltage-divider-basic]
teaches: [npn-transistor, switching, button-control]
---
## What you see
A button, a base resistor, an NPN transistor, and an LED with its current-limiting resistor. When the button is pressed, the transistor turns on and the LED lights up. Release the button and the LED goes dark. The transistor acts as an electronic switch controlled by a tiny base current.

## Try this
1. Press the button and watch the LED turn on — the transistor is conducting.
2. Change the base resistor to a much larger value and observe the LED dimming or failing to light, because the base current is too small to saturate the transistor.
3. Remove the base resistor entirely and note what happens — in a real circuit, excessive base current could damage the transistor.

## What is going on
An NPN transistor has three pins: base, collector, and emitter. A small current into the base (microamps to milliamps) allows a much larger current to flow from collector to emitter. The base resistor limits this control current to a safe level. When enough base current flows, the transistor saturates and behaves like a closed switch, dropping only about 0.2 V across collector-emitter. This is how microcontrollers drive loads that need more current than a GPIO pin can supply.

## Why it matters
Transistor switching is the foundation of digital electronics. Every logic gate, every motor driver, and every amplifier builds on this principle. Learning to control a transistor with a button prepares you to control one with a microcontroller pin.

## Go further
- [44-darlington-motor](../44-darlington-motor) — stack two transistors for even higher gain to drive a buzzer.
- [46-port-overcurrent](../46-port-overcurrent) — see why you need a transistor when a single MCU pin cannot supply enough current.
- Experiment: measure the base current and collector current, then calculate the transistor's current gain (hFE = Ic / Ib).
