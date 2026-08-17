# Pocket Calculator

A usable calculator: an Arduino Nano, a **GME12864-70 OLED** (SSD1306,
128×64, the 4-pin I²C module in white/blue), and **fifteen keys** on
breadboards.

## How it works

The fifteen keys sit on a **4×4 scan matrix** — four row wires driven
one at a time (D2–D5), four column wires read back (D6, D7, D8, D12)
through 10 kΩ pull-downs. That is how every real keyboard avoids
needing one pin per key: 8 pins carry 15 buttons.

The OLED speaks I²C on the Nano's real bus pins (**A4 = SDA,
A5 = SCL**) — four wires total to the display: VCC, GND, SCL, SDA.

The arithmetic is classic chain style: type a number, press an
operator, type the next, press `=`. `C` clears the entry, `AC`
clears everything.

## Try it

Run the program, then click the buttons in SIM mode:
`5` `+` `3` `=` shows **8**. The `+`/`−` indicator appears at the top
right of the display while an operation is pending.

Key layout:

```
7 8 9 +
4 5 6 −
1 2 3 =
0 C AC
```
