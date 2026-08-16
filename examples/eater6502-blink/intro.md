# Blink — the 6502 breadboard computer's first light

This is the moment every Ben Eater build works toward: eight LEDs on
the VIA's port B, walking. The machine is the real thing — W65C02,
32K RAM, 32K ROM, the 6522 VIA, NAND-gate address decode — seated
across three breadboards the way the physical build is.

**What to watch:** press the green flag. The program compiles for the
6502, the bus extractor reads the wiring you see, and the LEDs light
one after another — each one a real simulated part with a real
current-limiting resistor, not a picture of an LED.

**Try:** change the wait times, or turn two LEDs on at once. Then open
the Circuit Check panel and find the address map the extractor derived
from the NAND wiring.
