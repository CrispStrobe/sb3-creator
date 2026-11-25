# Amplifier blinker: an LM386 flashes two LEDs

An audio amplifier can blink LEDs. A capacitor feeds the amplifier's output back to its own input, and that turns the amplifier into an oscillator that slowly flips between its two limits. A red LED lights on the high side, a green one on the low side.

**Teaches:** a relaxation oscillator from an amplifier and a capacitor, blink rate set by C, alternating LEDs

## What to do

Click **Sim** and watch the two LEDs. Then flip the slide switch to the smaller capacitor.

## What you should see

- Red and green take turns, about 1.6 blinks per second.
- With the smaller capacitor the blinking is about twice as fast.

## Why it works

Each time the output jumps, the capacitor pushes the amplifier's plus input the same way, and the amplifier, which multiplies its input by 20, is driven all the way to that side. The push slowly fades as the capacitor charges through the resistor. When it has almost gone, the amplifier lets go and flips to the other side, and the game starts again. A smaller capacitor charges faster, so the LEDs blink faster.
