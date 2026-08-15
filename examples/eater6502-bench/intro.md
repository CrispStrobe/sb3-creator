---
level: advanced
age: 14+
prereqs: [01-blink]
teaches: [address-decode, bus-contention, open-vectors, memory-map, glue-logic]
---
## What you see
A complete Ben Eater–style 6502 computer on a breadboard: W65C02 CPU, 32 KB RAM (62256), 32 KB ROM (28C256), a W65C22 VIA (parallel I/O), a W65C51 ACIA (serial), and two 74HC00 NAND gates that decode the address bus.

## Try this
1. Power on and run — the Warnings panel should show no bus contention errors.
2. Read the memory map notes in the Warnings panel: RAM at $0000–$3FFF, ROM at $8000–$FFFF, VIA at $6000, ACIA at $5000.
3. Disconnect the wire from glue1.1y to rom.ceb and watch the extractor report an open-vectors error: nothing responds at $FFFA–$FFFF.

## What is going on
The 6502 sees a flat 64 KB address space. Every chip on the bus must answer ONLY at its assigned addresses — if two chips respond at the same address, they fight over the data bus (**bus contention**), which gives garbage or damages chips.

The **address decode** uses two 74HC00 quad-NAND packages to generate chip-select signals from the high address lines:
- **RAM** ($0000–$3FFF): selected when A15=0 AND A14=0.
- **ROM** ($8000–$FFFF): selected when A15=1.
- **VIA** ($6000–$7FFF): selected when A15=0 AND A14=1 AND A13=1.
- **ACIA** ($5000–$5FFF): selected when the VIA is NOT selected AND A13=0 AND A12=1.

The **vectors** ($FFFA–$FFFF: NMI, RESET, IRQ) must land in ROM. If the ROM's chip-enable is wrong, the CPU reads garbage at power-on and never starts.

## Why it matters
Address decode is the first real hardware-design skill. A working memory map means you understand binary logic, chip selects, and the bus — which is what makes a pile of chips into a computer. Every retro computer (Apple II, BBC Micro, Commodore 64) has exactly this structure.

## Go further
- [eater6502-contention-bug](../eater6502-contention-bug) — the same circuit with a deliberate wiring error. Can you find where two chips collide?
- [eater6502-vdp-hello](../eater6502-vdp-hello) — add a TMS9918A video chip to the bus.
- [z80-bench](../z80-bench) — a different classic CPU on a breadboard.
