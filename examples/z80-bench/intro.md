---
level: advanced
age: 16+
prereqs: []
teaches: [z80-cpu, retro-computing, serial-output]
---
## What you see
A Z80 breadboard computer with ROM, RAM, and a serial interface. The Z80 executes a program from ROM that sends text over the serial port — you see the output in a terminal. This is a minimal working computer built from a handful of chips.

## Try this
1. Run the simulation and watch "Hello" appear in the serial terminal — the Z80 is running.
2. Slow the clock and observe the Z80's bus activity: address lines changing, data lines carrying opcodes, and the UART transmitting bytes.
3. Change the message in ROM and see the new text appear on the terminal.

## What is going on
The Z80 fetches instructions from ROM over an 8-bit data bus addressed by a 16-bit address bus. RAM provides working memory. The UART (serial interface) converts parallel data from the Z80 into a serial bitstream at a fixed baud rate. To print a character, the program writes its ASCII code to the UART's data register. The Z80 was the CPU behind the ZX Spectrum, Amstrad CPC, and countless CP/M machines. It is similar to the 8080 but with a richer instruction set and more registers.

## Why it matters
The Z80 family sold hundreds of millions of units and ran the first generation of personal computers. Building one on a breadboard shows that a complete computer needs surprisingly few parts: a CPU, some memory, a clock, and an I/O device. The same bus architecture — address bus, data bus, control signals — appears in every computer ever made, just wider and faster.

## Go further
- [eater6502-bench](../eater6502-bench) — a different classic CPU on a breadboard.
- [eater6502-vdp-hello](../eater6502-vdp-hello) — adding video output to a retro breadboard computer.
- Experiment: write a program that echoes serial input back to the terminal — reading from the UART and writing back what it received turns the Z80 into an interactive system.
