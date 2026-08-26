# Aurora-65 workstation — expected behaviour

The ROM boots from `$8000`, establishes a valid 160×128 VGA signal, writes
non-zero pixels to the physical SSD1306 GDDRAM, and polls the PS/2 byte bus on
VIA port A using CA1's rising-edge flag. A key press changes both displays.

All three controller widgets are part-bound (`vga`, `oled1`, `kbd`). The
circuit extractor must report the SimpleVGA card plus PS/2 on VIA A/CA1.

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
