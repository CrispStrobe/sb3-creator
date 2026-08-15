---
level: advanced
age: 16+
prereqs: [eater6502-bench]
teaches: [vdp, video-output, retro-graphics]
---
## What you see
The 6502 breadboard computer extended with a TMS9918A video display processor. The VDP generates a video signal showing text or graphics on a screen — the same chip that powered the MSX, ColecoVision, and TI-99/4A home computers.

## Try this
1. Run the simulation and see "HELLO" appear on the video display — the 6502 is writing characters to the VDP's video RAM.
2. Change the text string in ROM and watch the display update.
3. Try writing to different screen positions by changing the VDP's name table address.

## What is going on
The TMS9918A has its own 16 KB of video RAM and generates a video signal independently of the CPU. The 6502 communicates with it through two I/O ports: one for data, one for commands. To display text, the CPU sets up the VDP's registers (screen mode, colors, memory layout), then writes character codes to video RAM. The VDP renders those characters into pixels at 60 Hz using its built-in character set. The CPU only needs to write the data once — the VDP refreshes the screen on its own.

## Why it matters
This is how 1980s home computers displayed graphics. The VDP offloads all video generation from the CPU, which is essential when the CPU is slow. Understanding this division of labor — CPU for logic, dedicated chip for display — is the same principle behind modern GPUs. Retro computing makes it visible at a human-readable scale.

## Go further
- [eater6502-bench](../eater6502-bench) — the base 6502 computer without video.
- [z80-bench](../z80-bench) — a different retro CPU that also paired with the TMS9918 historically.
- Experiment: switch the VDP to Graphics II mode and try drawing colored tiles instead of text — this is how games on the MSX and ColecoVision rendered their sprites and backgrounds.
