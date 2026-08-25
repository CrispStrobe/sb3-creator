# Pocket calculator, on a board

The same calculator as `70-calculator`, wired the way a finished board wires
things instead of the way a breadboard does.

On the breadboard version every key has one leg on its GPIO and the other on
+3V3, and the Pico's internal pull-downs hold the pin low until you press.
Pressed reads HIGH.

Here every key has one leg on its GPIO and the other on **GND**, and the
internal **pull-ups** hold the pin high until you press. Pressed reads LOW.

Both are correct. The second is what almost every real board does, because a
ground plane is already under every part and a supply rail is not, so the
shorter, quieter wire is the one to ground.

In the dialect that is one word per pin:

    PIN b9 = GP2 INPUT              # keys to +3V3, pull-down, pressed = HIGH
    PIN b9 = GP2 INPUT ACTIVE LOW   # keys to GND,  pull-up,   pressed = LOW

`read b9` keeps meaning "pressed" either way — the polarity lives in the
declaration, not in the logic — so not one line of the arithmetic changes.

The green LED sits across the Pico's regulated 3V3 rail through a 390 ohm
resistor. It is not connected to a GPIO and appears nowhere in the program: it
is lit whenever the regulator is running. A power light wired to a pin goes
dark when the program hangs, which is exactly when you want it lit.
