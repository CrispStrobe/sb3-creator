# Toggle flip-flop with steering diodes, and a coin toss

One button, two states: each press flips a pair of transistors from red to green or back. Let a fast oscillator press the button for you while you hold TOSS, and you have an electronic coin.

**Teaches:** T flip-flop, steering diodes, divide by two, random by timing

## What to do

Click **Sim**. Press the STEP button (button_15, beside the flip-flop) a few times. Then hold the TOSS button (button_30, beside the amplifier chip) for a moment and let go.

## What you should see

- Each STEP press swaps red and green.
- While TOSS is held both LEDs flicker; on release one stays lit — you cannot predict which.

## Why it works

Each falling edge on the trigger line tries to pull both bases down, but only one diode can pass it: the one on the side whose collector is low, i.e. the transistor that is on. Switching that one off lets the other one take over. The oscillator makes 55 such edges a second, so where it stops depends on how long you held the button, down to a hundredth of a second.
