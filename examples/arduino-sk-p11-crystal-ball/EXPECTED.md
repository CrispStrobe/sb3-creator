# arduino-sk-p11-crystal-ball — expected behaviour

## Circuit

Arduino Uno D6 <- tilt switch with pull-down. No LEDs — serial output only.

## Program

When tilt switch is triggered, picks a random number 1-8 and prints a corresponding fortune to serial: "Yes", "Most likely", "Certainly", "Ask again", "Without a doubt", "Outlook good", "Signs point to yes", or "Reply hazy".

## Observable behaviour

- **Tilt switch not triggered:** nothing happens. Serial is quiet.
- **Tilt switch triggered:** serial prints one of eight fortune messages at random.
- Each trigger produces a new random fortune.
- Messages are printed one per trigger event.

## What this verifies

1. `pick random 1 to 8` generates random selections
2. Cascaded if-statements map number to message
3. Event-driven output: prints only on tilt switch activation
