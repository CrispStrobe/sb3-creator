---
level: advanced
age: 14+
teaches: [vdp, video-output, tms9918, retro-graphics]
---
## What you see
A TMS9918A video display processor generating a text-mode screen. The VDP
renders characters from its built-in font onto a 256×192 pixel display.

## Try this
1. Build the machine and load a ROM — text appears on the VDP screen.
2. The VDP uses its own 16 KB of video RAM; the CPU writes characters to it.

## What is going on
The TMS9918A is a dedicated video chip (MSX, ColecoVision, TI-99/4A). It
generates video independently of the CPU. The CPU writes to its registers
and VRAM through two I/O ports — data and control.

*Scaffold — program body pending VDP widget integration.*
