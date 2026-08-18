# Expected behavior
- On run, the OLED face starts blank (oled clear).
- "HI BRICKWRIGHT" appears on page 0 (top row) within the first second.
- Page 1 shows "COUNT: 0", then "COUNT: 1", incrementing every ~1 s.
- The debugger's pin panel shows I2C activity bursts on P2.1/P2.2 during each print.
- Engine-level: `ssd1306Pixel(state, x, y)` returns 1 for lit pixels in the font bitmap regions; the GDDRAM receives page-mode writes with control byte 0x40 (data stream).

```assert
# Supply rail: VCC = 5.0V
net VCC.vcc V 5.00 +-0.01
```
