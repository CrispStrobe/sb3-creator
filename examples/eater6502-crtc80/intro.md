# 6502 + 80×32 CRTC Text

Open the example and select Controller to see the text screen. The ROM writes
the MC6845 registers at $4000/$4001 and writes character codes into RAM at
$3000. Look for a plus sign in all four corners, including the last cell.

The CRTC reads a 4 KiB window in the 6502's RAM. The model supplies an 8×8
character ROM and uses frame timing. This lesson models the CPU-side select
and register wiring and a shared-memory character display.

[65C02 assembly](main.s) · [Linker configuration](rom.cfg)
