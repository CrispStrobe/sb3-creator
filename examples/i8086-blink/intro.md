---
level: intermediate
age: 12+
prereqs: [gpio]
teaches: [8086, 8255-ppi, port-io, gpio]
---
## What you see
One of eight LEDs blinks on and off once per second. The board is an Intel 8086 CPU wired to an 8255 programmable peripheral interface (PPI); the eight LEDs hang off the 8255's port B. The program drives just the lowest bit, `P2.0`, so LED 0 blinks while the other seven stay dark.

## Try this
1. Run the program and watch LED 0 blink at 1 Hz.
2. The other seven LEDs (`P2.1`–`P2.7`) are the rest of the same 8255 port. Change `PIN led = P2.0 OUTPUT` to `PORT leds = P2 OUTPUT`, then `turn on led` to `set leds to 255` and `turn off led` to `set leds to 0` — now all eight blink together.
3. From there, `set leds to 1`, `set leds to 2`, `set leds to 4` … walks a single lit bit across the port — a classic 8255 output demo.

## What is going on
The 8086 has no GPIO pins of its own; it reaches the outside world over its bus. The 8255 sits on that bus as an I/O-mapped port chip: the CPU writes a byte to the 8255's port-B address and those eight bits appear on the eight port-B pins. `PIN led = P2.0` names bit 0 of that port, and `turn on`/`turn off` set and clear it. This is how every early PC drove its peripherals — the 8255 was on the original IBM PC motherboard.

## Why it matters
It is the same blink as every other board here, but it shows the one thing that makes the 8086 different: output goes through a port chip on the bus, not through a pin on the CPU. Understanding that the 8255 is a separate addressable device is the key to everything else you can wire to an 8086.
