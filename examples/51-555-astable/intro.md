---
level: advanced
age: 16+
prereqs: [43-rc-timing]
teaches: [555-timer, astable, oscillator]
---
## What you see
A 555 timer IC wired in astable mode — it oscillates continuously without any external trigger, blinking an LED at a rate set by two resistors and a capacitor. No microcontroller, no code — the 555 generates a square wave all on its own.

## Try this
1. Run the simulation and observe the LED blinking at a steady rate.
2. Change the timing capacitor to a larger value and watch the blink rate slow down.
3. Adjust the ratio of the two timing resistors and notice the duty cycle changing — the on-time and off-time are no longer equal.

## What is going on
In astable mode, the 555 charges the timing capacitor through two resistors (R1 and R2) to 2/3 VCC, then discharges it through R2 alone down to 1/3 VCC, and repeats. The output toggles between high and low at each threshold, producing a square wave. The frequency is approximately f = 1.44 / ((R1 + 2*R2) * C). Because charge and discharge paths differ, the duty cycle is not exactly 50% unless you add a diode to bypass R1 during charging. This simple circuit has been used in millions of products since 1972.

## Why it matters
The 555 timer is one of the most produced ICs in history. It teaches oscillator design, RC timing, and threshold comparators in a single package. Understanding astable mode is the gateway to building clocks, tone generators, and PWM controllers without a microcontroller.

## Go further
- [43-rc-timing](../43-rc-timing) — review the RC charging curve that the 555 relies on internally.
- [24-pwm-fade](../24-pwm-fade) — compare the 555's hardware PWM with a microcontroller's software PWM.
- Experiment: calculate the resistor and capacitor values needed for a 1 kHz audible tone, build the circuit, and connect a small speaker instead of the LED.
