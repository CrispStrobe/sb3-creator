---
level: intermediate
age: 12+
prereqs: [11-toggle-button]
teaches: [timing-measurement, event-detection, human-interface]
---

## What you see

An LED sits dark for three seconds. When it lights up, you press the button as
fast as you can, and the program counts how long that took. There is no display
on this bench: the LED itself reports the answer, blinking once per 10 ms of
your reaction time — so a typical 250 ms reaction blinks about 25 times. This
example works on all supported microcontrollers — pick a different device in
the toolbar to see the adapted circuit.

## Try this

1. Click **Sim** and wait three seconds -- do not press the button before the
   LED lights up.
2. The instant the LED turns on, press the button. The LED then blinks your
   reaction time back at you, one blink per 10 ms.
3. Count the blinks. Around 15 is very fast, 25 is typical, 40 means you were
   distracted.

## What is going on

The MCU waits a fixed three seconds, turns the LED on, and counts in 10 ms
steps until it sees the button go low. Then it blinks that count back. Human
reaction to a visual stimulus is typically 150--300 ms, which feels
instantaneous but is an eternity to a microcontroller clocked at millions of
cycles per second: in 250 ms this chip executes well over a million
instructions.

The delay being *fixed* is this version's real weakness, and worth noticing:
once you have run it a few times you start anticipating the light, and you are
no longer measuring reaction at all. A random delay is what a real reaction
timer uses, and adding one is the first exercise below.

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
- **Experiment:** make the delay unpredictable. The dice example shows the
  trick with no random instruction at all: run a counter fast in a loop and let
  the moment *you* start the round decide where it stops.
- **Experiment:** catch a false start. Watch the button during the three-second
  wait, and if it goes low before the LED lights, abandon the round and signal
  it -- three quick blinks, say.
