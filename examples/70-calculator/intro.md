# Pocket Calculator

A usable calculator: a **Raspberry Pi Pico**, a **GME12864-70 OLED**
(SH1106-class, 128×64, the 4-pin I²C module) and **seventeen keys** on
breadboards.

## The hardware

There is no scan matrix here — seventeen keys, one per GPIO, **GP2–GP18**.
Each key has one leg on its pin and the other on **+3V3 (not VBUS)**, and
the Pico's internal pull-downs do the rest, so a pressed key reads **HIGH**
and no external resistors are needed. It costs pins and buys simplicity:
nothing to scan, nothing to debounce across rows.

The OLED speaks I²C on **GP0 = SDA, GP1 = SCL** — four wires to the
display: VCC, GND, SCL, SDA.

```
9 0 1 2 3 4 5 6 7 8   digits       GP2 .. GP11
+ - * /               operators    GP12 .. GP15
EXE                   equals       GP16
DEL                   backspace    GP17   (Pico pin 22)
AC                    clear all    GP18   (Pico pin 24)
```

Header numbering and GPIO numbering are different coordinate systems:
**physical pin 22 is GP17**. Establish which one is meant before wiring.

## How the screen is drawn

Every OLED verb used to push the whole frame. A 128×64 frame is a **1 KB
I²C transfer**, and this screen is six verbs, so a single keypress sent six
of them and the display tore visibly. This program ends its frame with
`oled show`, which switches the generator to a buffered driver: `oled clear`
and each `oled print` only touch RAM, and one blit goes out at the end.

```
row 0   RECHNER
y 10    ----------------
row 2   <acc> <op>            the pending operation, left
row 5            <entry>      what you are typing, right-aligned
y 55    ----------------
```

The right alignment is `oled set cursor 5 (16 - length of entry)` — the
8×8 font gives 128 px ÷ 8 = 16 columns. That idiom is Pico-specific: the C
OLED driver uses a 6 px cell, so the same expression is wrong there.

## Try it

`5` `+` `3` `EXE` shows **8**. Chain arithmetic works the usual way: type a
number, press an operator, type the next, press `EXE`. `DEL` removes the
last digit you typed, `AC` clears everything. A displayed result is not
editable — `DEL` zeroes it and the next digit starts a new number.

For the plainer original — `C` clearing the whole entry, and no buffered
driver — see **Pocket Calculator (simple)**.
