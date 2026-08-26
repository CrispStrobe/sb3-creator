---
level: advanced
age: 14+
prereqs: [01-blink]
teaches: [address-decode, via, ps2, oled, i2c, vga, memory-map, glue-logic]
---
## What you see
A complete **Aurora-65** workstation: W65C02, RAM, ROM, W65C22 VIA,
W65C51 ACIA, a 128×64 SSD1306 OLED, a 74-key PS/2 keyboard, and a
SimpleVGA6502 write-snoop card. The OLED and VGA monitor in the Controller
mirror the physical device buffers; they are not copied text variables.

## Try this
1. Run it. The ROM first writes VGA sync into video RAM, then initializes the OLED over VIA PB1/PB2.
2. Type in the Controller keyboard or click a key on the full keyboard drawn in the Circuit.
3. Watch the same PS/2 scan byte become a colour trail on VGA and a bar/binary pattern on OLED.
4. Disconnect `kbd.da → via.ca1`: keys still transmit, but firmware no longer sees DATA READY.

## What is going on
The 6502 sees a flat 64 KB address space. Every chip on the bus must answer ONLY at its assigned addresses — if two chips respond at the same address, they fight over the data bus (**bus contention**), which gives garbage or damages chips.

The **address decode** uses two 74HC00 quad-NAND packages to generate chip-select signals from the high address lines:
- **RAM** ($0000–$3FFF): selected when A15=0 AND A14=0.
- **ROM** ($8000–$FFFF): selected when A15=1.
- **VIA** ($6000–$7FFF): selected when A15=0 AND A14=1 AND A13=1.
- **ACIA** ($5000–$5FFF): selected when the VIA is NOT selected AND A13=0 AND A12=1.

The **vectors** ($FFFA–$FFFF: NMI, RESET, IRQ) must land in ROM. If the ROM's chip-enable is wrong, the CPU reads garbage at power-on and never starts.

One VIA carries three independent jobs: PA0–PA7 receives the keyboard byte,
CA1 receives DATA READY, PB0 selects the VGA VRAM bank, and PB1/PB2 bit-bang
I²C to the OLED. `program.c`, `startup.s`, and `program.cfg` reproduce the
checked-in 32 KB ROM with `./build-rom.sh`.

## Provenance and licensing

The VGA card behavior follows gfoot's **simplevga6502**, released under the
Unlicense. The in-repository implementation adopts its documented memory and
sync behavior. The PS/2 and SSD1306 paths are original implementations from
published protocol/datasheet facts. We did not copy the unlicensed rehsd
EasyEDA, Gerber, PCB artwork, or source files; that article is useful design
context but is not redistribution permission.

## Why it matters
Address decode is the first real hardware-design skill. A working memory map means you understand binary logic, chip selects, and the bus — which is what makes a pile of chips into a computer. Every retro computer (Apple II, BBC Micro, Commodore 64) has exactly this structure.

## Go further
- [eater6502-contention-bug](../eater6502-contention-bug) — a circuit with a deliberate wiring error.
- [eater6502-vdp-hello](../eater6502-vdp-hello) — add a TMS9918A video chip to the bus.
- [z80-bench](../z80-bench) — a different classic CPU on a breadboard.
