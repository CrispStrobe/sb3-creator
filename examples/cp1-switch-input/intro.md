---
level: foundation
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-input, binary-input, polling]
---
## Let a switch choose the value

This original program repeatedly reads CP1 input line 1 with `P1E 1`, displays the result with `ANZ`, waits with `VZG 100`, and returns to `sample`. CP1 operands count lines from 1; the matching circuit terminal is `P1.0`. Operand 0 would read the whole port.

Import your own compatible monitor ROM, load this source and start the teaching program at cell 0 through the monitor. The fixture uses a pull-up and a button to ground: released predicts a high input, pressed predicts a low input. Compare that electrical level with the display instead of assuming that pressed always means one.

## Try this

1. Predict the input bit for a released and a pressed button, then inspect `P1.0` in the port view.
2. Hold the button while the program runs. Compare the port reading and the display. The program samples repeatedly; it does not receive a host-language button event.
3. Change `VZG 100` to `VZG 250`. Compare how quickly the display follows a brief press. The operand is the requested delay in milliseconds; execution and display scanning also take CPU time.
4. Pause the CPU, change the input, and observe that RAM and display scan history do not advance until CPU execution resumes.

The lesson asks you to confirm the measured correspondence manually. It does not infer success from an input click.
