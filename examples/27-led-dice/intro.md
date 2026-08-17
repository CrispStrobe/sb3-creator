---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [random, led-pattern, button-trigger]
---

## What you see

Seven LEDs are arranged in the classic dice-face pattern. When you press the
button, they cycle rapidly through patterns for a moment and then land on a
random number from 1 to 6, lighting the LEDs that match that face of a die. This example works on all supported microcontrollers — pick a different device in the toolbar to see the adapted circuit.

## Try this

1. Click **Sim** and press the button. Watch the LEDs settle on a dice face.
2. Press again several times. Each result should look like a real die face --
   one dot in the centre for 1, two corners for 2, and so on up to six.
3. Count how often each number comes up over 20 presses. It should be roughly
   even, though 20 rolls is too few to prove it.

## What is going on

The MCU has a table of seven LED states for each of the six faces. When the
button is pressed, it picks a random number between 1 and 6, looks up the
matching row in the table, and drives each LED on or off accordingly. The brief
cycling animation before it settles is just the MCU picking a new random number
every few milliseconds while the button is held, giving the visual impression of
tumbling. The randomness comes from a timer or counter that is running in the
background -- its value at the exact instant you release the button is
unpredictable enough to feel fair.

## Why it matters

Mapping a number to a pattern is the simplest kind of lookup table, and lookup
tables are everywhere in embedded systems: character fonts, sine waves, error
codes, and pin configurations are all just a number selecting a row of data.

## Go further

- **Where the LED basics come from:** [01-blink](../01-blink) -- single LED
  on and off.
- **Another random project:** [25-reaction-timer](../25-reaction-timer) --
  random delays used for measurement instead of display.
- **Experiment:** add a seventh face that lights all seven LEDs as a special
  "lucky 7" roll. You will need to change the random range from 1--6 to 1--7
  and add one more row to the pattern table.
