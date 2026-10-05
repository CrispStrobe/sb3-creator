---
level: beginner
age: 10+
prereqs: [11-toggle-button]
teaches: [edge-detection, polling, non-blocking]
---
## What you see
Two keys, two lamps. Each key switches its own lamp on and off, and the two never get in each other's way — you can even hold one key down and keep using the other.

## Try this
1. Run the program and press A, then B, then A again. Each lamp follows its own key.
2. Hold A down and press B several times. B keeps working.
3. Look at 11-toggle-button, which uses `wait until`. Why would two copies of that program's loop not work for two keys in one script?

## What is going on
`wait until key pressed` stops the whole program until that one key is pressed — while it waits, the other key is ignored. This program never waits for a key. Fifty times a second it looks at both, and for each key it compares what it sees now with what it saw last time. Only a change from released to pressed — an edge — toggles the lamp. Holding a key produces no new edge, so nothing happens until it is released and pressed again.

The 20 ms between looks also hides contact bounce, the few milliseconds of on-off chatter a real key makes when it closes.

## Why it matters
Real devices watch many inputs at once: a game controller, a keyboard, a machine panel. Polling everything in one loop and reacting to changes is the basic pattern behind all of them.

## Go further
- [11-toggle-button](../11-toggle-button) — one key with a blocking wait.
- [sense-noise-counter](../sense-noise-counter) — the same edge detection on a sound sensor.
- Experiment: add a third key that switches both lamps off at once.
