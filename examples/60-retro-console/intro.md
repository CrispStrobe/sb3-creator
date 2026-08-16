---
level: advanced
age: 14+
teaches: [multiplexing, matrix-scan, seven-segment, transistor-driver, buttons]
---
## The console on your desk, on your bench

This is the RBS15667 soldering-kit retro console, rebuilt as a circuit
you can probe: an STC15F2K60S2 drives two 8×8 LED matrices as one
16×8 playfield, three 7-segment score digits, five buttons and a
buzzer — and the trick that makes it teachable is that **all three
displays share one 8-line scan bus**. The matrices use it as their
row lines; the digits use the same wires as their segments. One
multiplex loop, three displays.

The firmware here is a self-test: a bar sweeps down the playfield,
an 8 walks across the score digits, and holding any button sounds
the buzzer (the PNP is a high-side switch — the pin goes LOW to
beep). If you own the real kit, the exact same program flashes onto
it: the chip is socketed, and `make PART=stc15f2k60s2 flash` is the
whole ceremony.
