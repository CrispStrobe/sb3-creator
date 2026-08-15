---
level: advanced
age: 16+
prereqs: []
teaches: [6502-cpu, retro-computing, breadboard-computer]
---
## What you see
A complete 6502-based breadboard computer: the CPU, a 32 KB ROM, a 6522 VIA for I/O, and an oscillator providing the clock. LEDs on the VIA's output port show the running program's state. This is a computer built from individual chips on a breadboard, not a pre-made board.

## Try this
1. Run the simulation and watch the LEDs on the output port cycle through a pattern — this is the 6502 executing machine code from ROM.
2. Slow the clock down and observe each step: the address bus changing, the data bus carrying opcodes, and the output port updating.
3. Change the ROM contents to output a different LED pattern and see the result immediately.

## What is going on
The 6502 processor fetches instructions from the ROM one byte at a time over the address and data buses. The 6522 VIA maps its I/O ports into the 6502's memory space, so writing to a specific address sets the output pins. The clock drives every step: each rising edge advances the CPU by one cycle. With a slow clock you can literally watch the computer think — each bus transaction is visible. This is the same architecture as the Apple II and Commodore 64, stripped to its minimum.

## Why it matters
Building a computer from chips on a breadboard demystifies what a CPU actually does. There is no operating system, no bootloader, no abstraction — just a processor reading instructions and moving data. Understanding this level makes every higher-level concept (compilers, operating systems, programming languages) more concrete. Ben Eater's 6502 project has introduced thousands of people to computer architecture this way.

## Go further
- [eater6502-vdp-hello](../eater6502-vdp-hello) — add video output to the 6502 breadboard computer.
- [z80-bench](../z80-bench) — a different classic CPU on a breadboard.
- Experiment: write a short program that counts in binary on the LEDs — incrementing a byte and outputting it to the VIA port in a loop.
