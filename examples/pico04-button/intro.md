---
level: beginner
age: 12+
prereqs: [pico01-blink]
teaches: [button-input, digital-input, led-control]
---
## What you see
A push button connected to a GPIO pin of the Raspberry Pi Pico controls an LED. Press the button and the LED turns on; release it and the LED turns off. The simplest input-to-output connection.

## Try this
1. Press and hold the button — the LED lights up. Release it — the LED goes dark.
2. Try rapid presses and see the LED follow instantly.
3. Modify the program to invert the logic: LED on when the button is released, off when pressed.

## What is going on
The button connects the GPIO pin to ground when pressed. The Pico's internal pull-up resistor holds the pin high when the button is open. The program reads the pin state in a loop: when it reads low (button pressed), it drives the LED pin high; when it reads high (button released), it drives the LED pin low. There is no debouncing in this simple version, but the response is fast enough that bouncing is not visible to the eye.

## Why it matters
Reading a button is the most basic form of user input. Every control panel, game controller, and user interface starts with detecting a press. Once you can read one button reliably, you can read many, add debouncing, detect long presses, and build full input systems.

## Go further
- [pico01-blink](../pico01-blink) — output only, no input.
- [pico03-two-tasks](../pico03-two-tasks) — do more than one thing while watching the button.
- Experiment: add a counter that increments with each press and prints the count to serial — you will likely see the count jump by more than one per press, which is bouncing in action.
