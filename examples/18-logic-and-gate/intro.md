---
level: beginner
age: 8+
prereqs: [05-counter-7seg]
teaches: [and-logic, boolean-algebra, button-input]
---
## What you see
Two push buttons and one LED. The LED only turns on when both buttons are pressed at the same time. Release either one and it goes dark.

## Try this
1. Press just the left button — the LED stays off.
2. Press just the right button — still off.
3. Press both buttons together and the LED lights up.

## What is going on
This implements a logical AND gate in software. The MCU reads two input pins, one for each button, and sets the output pin high only when both inputs are high. In Boolean algebra this is written as Q = A AND B. Hardware AND gates work the same way inside every CPU — this project makes the invisible logic visible with buttons and an LED. The buttons use the 8051's quasi-bidirectional inputs, which read high when unpressed and low when the button connects the pin to ground.

## Why it matters
AND, OR, and NOT are the three building blocks of all digital logic. Every decision a computer makes — from "is this pixel white?" to "should I fire this rocket engine?" — is composed of these basic operations. Understanding them with physical buttons builds intuition that no truth table can.

## Go further
- [19-logic-or-gate](../19-logic-or-gate) — the OR gate companion to this AND gate.
- [05-counter-7seg](../05-counter-7seg) — button input driving a more complex output.
- Experiment: add a third button and make the LED require all three pressed — a three-input AND gate.
