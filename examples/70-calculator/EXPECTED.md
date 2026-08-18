# Expected behaviour

Verified headless (2026-08-17): pseudocode → generateC (AVR) →
avr-gcc (1.8 KB) → avr8js on the example board.

- Boot: the OLED shows `CALC` and `0`.
- Press `5`: display shows `5`.
- Press `+`: the `+` glyph appears top right, display shows `5`.
- Press `3`: display shows `3`.
- Press `=`: display shows `8`.
- Press `AC`: the framebuffer returns byte-identical to the boot
  state — the strongest equality a display test can assert.

The matrix scan depends on the AVR adapter's per-output-edge input
refresh (bw-board a26ec6e); before it, no matrix key could register
in simulation.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
