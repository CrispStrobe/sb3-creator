---
level: intermediate
age: 12+
prereqs: [11-toggle-button]
teaches: [timing-measurement, random, human-interface]
---

## What you see

An LED sits dark while the MCU waits a random number of seconds. When the LED
lights up, you press a button as fast as you can, and the program measures how
many milliseconds passed between the light and your press. The 7-segment
display (or serial output) shows your reaction time.

## Try this

1. Click **Sim** and wait. The LED will light up after a random delay -- do
   not press the button before it does.
2. The instant the LED turns on, press the button. Your reaction time appears
   on the display.
3. Try pressing the button *before* the LED lights up. The program should
   catch this and tell you it was a false start.

## What is going on

The MCU picks a random delay (say 2--5 seconds), waits that long, then turns
the LED on and starts a millisecond timer. When it detects the button press, it
stops the timer and reports the elapsed count. The random delay prevents you
from guessing the moment, so what you are measuring is genuine human reaction
time -- typically 150--300 ms for visual stimuli, which feels instantaneous but
is an eternity to a microcontroller clocked at millions of cycles per second.

## Why it matters

Timing measurement is the foundation of every sensor that converts a physical
event into a number. Ultrasonic rangefinders, capacitive touch sensors, and
frequency counters all work the same way: start a clock, wait for an event,
read the clock.

## Go further

- **Debouncing matters here:** [26-debounce](../26-debounce) -- a bouncy button
  can add milliseconds of noise to your measurement.
- **Another random project:** [27-led-dice](../27-led-dice) -- random numbers
  driving LED patterns instead of timing.
- **Experiment:** change the random delay range so the LED can light up after
  as little as 0.5 seconds or as long as 10. Does knowing the range is wider
  make your reaction time worse?
