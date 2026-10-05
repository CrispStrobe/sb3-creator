---
level: beginner
age: 10+
prereqs: [01-blink, 11-toggle-button]
teaches: [sound-module, toggle, dead-time]
---
## What you see
Clap once and the lamp LED switches on; clap again and it switches off. A sound module listens through its microphone and tells the MCU "loud" or "quiet" on a single digital wire.

## Try this
1. Run the program and press Clap: the lamp toggles.
2. Raise the sound level slider above the middle and leave it there. The lamp toggles once and then waits — the program needs the room to go quiet before the next clap counts.
3. Change the 0.3-second pause to 0 and clap a few times. Why can one clap now be counted twice on a real module?

## What is going on
A sound module combines a microphone, an amplifier and a comparator. When the sound is louder than the threshold set on the module, its digital output goes HIGH. A clap is not one clean pulse: it rings and echoes, so the output flickers for a few milliseconds.

The program therefore does three things per clap: it waits for loud, toggles the lamp, waits for quiet again, and then ignores the input for a short dead time. Without the last two steps a single clap could toggle the lamp several times.

## Why it matters
Turning a messy real-world signal into exactly one event is the same problem as debouncing a button, and the same fix — wait for the signal to settle and ignore it for a moment — appears in every input that is not perfectly clean.

## Go further
- [sense-noise-counter](../sense-noise-counter) — count the noises instead of toggling.
- [26-debounce](../26-debounce) — the same idea for a mechanical button.
- Experiment: make it a double-clap switch — only toggle if a second clap follows within one second.
