---
level: beginner
age: 8+
teaches: [seven-segment, display, counting]
---
## What you see
A single 7-segment display counting from 0 to 9, then wrapping back to 0.
Each digit stays for one second.

## Try this
1. Run the program — the display counts up.
2. Change `wait 1 seconds` to `wait 0.2 seconds` for faster counting.
3. Count by 2: use `change digit by 2` and wrap at `digit > 9`.

## What is going on
`show digit N on 1` drives the 7-segment display with the digit N (0–9).
The MCU sets the right combination of segments (a–g) for each numeral.
The display is common-cathode; each segment is a separate GPIO pin.

## Why it matters
7-segment displays are the simplest numeric output — clocks, meters, and
scoreboards all use them. Understanding which segments light for each
digit is the first step to custom displays.
