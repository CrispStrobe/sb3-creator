---
level: advanced
age: 16+
prereqs: []
teaches: [z80-cpu, retro-computing, address-decoding, glue-logic]
---
## What you see
A second Z80 breadboard computer — the same CPU as `z80-bench`, but a different builder's answer to the same problem. ROM at the bottom of memory, RAM at the top, and a handful of small logic chips that decide which one answers. Where the other bench uses a 1980s serial chip to reach a modern computer, this design reaches for a USB FIFO instead.

## Try this
1. Follow A15 from the CPU. It goes to exactly two places, and those two places are the entire memory map: one gate says "ROM", the other says "RAM".
2. Count the gates in the decode, then count the wires. Nine signals in, three chip selects and three port strobes out — this is the whole "glue logic" of a computer.
3. Compare with `z80-bench` side by side. Same CPU, same buses, different I/O device — and see how much of the machine that one choice changes, and how much it leaves alone.

## What is going on
A CPU on its own cannot tell a ROM from a RAM. It puts an address on 16 wires and pulls /MREQ low to say "this is memory". Something else has to turn that into "and therefore *this* chip should answer". Here that something is A15, the top address bit: low means the bottom half of the 64K space, high means the top half. One gate ANDs "memory request" with "A15 low" and enables the ROM; another ANDs it with "A15 high" and enables the RAM. That is the entire memory map — two gates.

The I/O side works the same way with different signals. The Z80 keeps I/O in its own space, entered with /IORQ instead of /MREQ, addressed by the low byte. This machine has only two ports, so it does not bother decoding eight address bits — A0 alone tells them apart. Even ports are port 0, odd ports are port 1, and writes ignore A0 entirely because there is only one thing to write to. It is a deliberate shortcut, and reading it is a good way to see that address decoding is a design choice, not a fixed rule.

The original builder's serial device is an FTDI UM245R: a USB chip that presents a **byte queue** rather than a serial port. He picked it after an FTDI cable driving a classic 6850 UART lost data — the FIFO buffers instead, and the CPU just asks "is there a byte?" before reading one.

## Why it matters
Two builders, one CPU, two machines. The bus is the same, the memory decode is nearly the same, and the I/O device is completely different — and that is what a computer architecture actually is: a small set of shared conventions plus a pile of local decisions. Seeing the same Z80 twice, wired two ways, teaches more than seeing it once.

## Go further
- [z80-bench](../z80-bench) — the same CPU with an MC6850 ACIA instead. The comparison is the lesson.
- [eater6502-bench](../eater6502-bench) — a different classic CPU, the same three questions: what clocks it, what remembers, what talks.
- Read EXPECTED.md first: this bench models the machine faithfully but its USB FIFO has no part in the engine yet, so the computer boots and cannot speak. Which parts are real and which are missing is written down rather than hidden.
