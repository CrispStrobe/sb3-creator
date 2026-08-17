---
level: beginner
age: 12+
prereqs: [01-blink]
teaches: [relay, npn-driver, flyback-diode]
---
## What you see
A relay clicks on and off every two seconds. An NPN transistor drives the relay coil because the MCU pin cannot supply enough current directly. A status LED mirrors the relay state so you can see the timing even without hearing the click. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this
1. Run the program and listen for the relay clicking on and off.
2. Watch the status LED — it tracks the relay exactly.
3. Remove the flyback diode from the circuit and observe what happens to the voltage spike when the relay turns off.

## What is going on
The relay coil needs 50–80 mA to energise, but an 8051 pin sources less than 1 mA. An NPN transistor amplifies the signal: the MCU drives the transistor's base through a resistor, and the transistor switches the coil current between collector and emitter. When the coil turns off, its magnetic field collapses and produces a voltage spike that could destroy the transistor. The flyback diode (wired reverse-parallel across the coil) shorts this spike safely. The status LED on a separate pin gives visual feedback.

## Why it matters
Relays let a tiny MCU switch mains-powered devices — lamps, heaters, motors. The NPN driver and flyback diode pattern appears in nearly every relay circuit. Getting it wrong destroys components; getting it right is a building block for home automation and industrial control.

## Go further
- [10-motor-speed](../10-motor-speed) — the same transistor-driver pattern, but with PWM for speed control.
- [01-blink](../01-blink) — review the basic output if relay driving feels like a big step.
- Experiment: add a second relay and alternate them so one is on while the other is off.
