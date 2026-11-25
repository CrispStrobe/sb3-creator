# CP1 blink — acceptance observations

Assembler checks: cells 0–6 are `[4,1]`, `[18,1]`, `[3,200]`, `[4,0]`, `[18,1]`, `[3,200]`, `[9,0]`. The base image has 256 bytes; each cell is opcode first. No ROM image is present.

With a compatible monitor ROM supplied by the user, start the teaching program at 0. P2.0 is expected to alternate high and low and the resistor-fed LED is expected to follow. The requested waits contribute 400 ms per loop, but an exact output period also includes the monitor's execution cost. State measured timing separately from this prediction.

Pausing the host CPU stops further machine execution. The last output latch value is expected to persist. Learning checkpoints require explicit observation, not recognition of source text or opening an instrument.
