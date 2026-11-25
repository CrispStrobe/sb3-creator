---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [gray-code, timed-output]
---
## Gray indicator

Import a compatible 2,048-byte monitor ROM. Run the CPU until the monitor shows its ready display, pause it, and load the cells. Resume CPU execution without resetting, and use the CP1 keypad to select the start address.

The three LEDs show circuit bits P2.0–P2.2. Watch the port values or slow down the sequence by increasing the delay operand.

Observe P2 terminals 1–3 with a logic analyzer or three appropriately driven indicators. Enter `008 PC RUN`. P2 emits `F8 F9 FB FA FE FF FD FC` in hex, starting with the first write after RUN. Each adjacent pair differs at exactly one terminal. Terminals 4–8 are held high throughout the sequence. Each level lasts approximately 84 ms, with an acceptance range of 70–105 ms between successive changes. Expect `P  020` within one second of the first write and P2 to remain `0xFC`. The run executes 72 teaching instructions, including eight delays of 75 units each. Base memory suffices. The program occupies 008–019, 030–032, and 044–051.
