---
level: foundation
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-output, loops, timing]
---
## Build a repeating output

This original seven-cell program writes one to output line 1, requests a 200 ms wait, writes zero, requests another wait, and jumps back. The selector in `P2A 1` is one-based; its circuit terminal is `P2.0`. A series resistor and LED make the output visible.

Import your own compatible CP1 monitor ROM, load the program into RAM, and start it at cell 0 through the monitor. Follow the actual port value and LED state. Host Run advances the 8049; the keypad's RUN starts the teaching program through the ROM.

## Try this

1. Match the source to the cells `04.001`, `18.001`, `03.200`, `04.000`, `18.001`, `03.200`, `09.000`.
2. Predict which writes make the LED conduct, then compare P2.0 and LED activity while running.
3. Change `WAIT` to 100 and measure the time between equivalent output edges. Two requested waits contribute 200 ms per loop; the firmware's instruction work adds time, so do not call 200 ms an exact measured period.
4. Pause the CPU while the LED is on. The output latch should retain its last level; distinguish a stored level from an actively advancing program.

Use a measured port transition or your own explicit observation to complete a checkpoint. The example does not automatically infer a blink from the presence of a loop.
