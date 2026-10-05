---
level: intermediate
age: 12+
prereqs: [sense-clap-switch]
teaches: [edge-detection, counting, time-window]
---
## What you see
The program listens for ten seconds at a time and counts how many separate noises it heard. Every counted noise makes the blip LED flash once; at the end of each window the count goes to the serial monitor, and the warn LED lights if the room was busy — five noises or more.

## Try this
1. Run the program and press Clap three times within ten seconds. Watch three flashes and then a 3 on the serial monitor.
2. Clap six times in one window: the warn LED comes on.
3. Hold the sound level slider high for two seconds. It counts as ONE noise — find the line that makes that true.

## What is going on
"Is it loud now?" is a level; "how many times did it get loud?" needs events. The program keeps the previous reading in a variable and counts only when the input goes from quiet to loud — a rising edge. A long noise stays loud, so it produces exactly one edge.

Sampling every 10 ms is fast enough to catch a clap but slow enough that the module's few milliseconds of flicker rarely produce a second edge.

## Why it matters
Counting edges in a time window is how many real measurements work: a bicycle computer counts wheel turns per second, a rain gauge counts bucket tips per hour, and a Geiger counter counts clicks per minute.

## Go further
- [sense-noise-light](../sense-noise-light) — measure HOW loud with the analog output instead of counting.
- [two-toggle-keys](../two-toggle-keys) — the same edge detection for two buttons at once.
- Experiment: print the count every second as well, so you can watch it rise during the window.
