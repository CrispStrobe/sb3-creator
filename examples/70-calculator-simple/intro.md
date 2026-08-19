# Pocket Calculator (simple)

The original of the pair. Same hardware as **Pocket Calculator** — a
**Raspberry Pi Pico**, a **GME12864-70 OLED** (SH1106-class, 128×64, I²C)
and **seventeen keys** — but the plainest version of the program, kept as a
reference for two things the other one changed.

## The hardware

Seventeen keys, one per GPIO, **GP2–GP18**. No scan matrix: each key has one
leg on its pin and the other on **+3V3 (not VBUS)**, with the Pico's internal
pull-downs doing the rest. A pressed key therefore reads **HIGH**, and no
external resistors are needed. The OLED is four wires — VCC, GND, and I²C on
**GP0 = SDA, GP1 = SCL**.

```
9 0 1 2 3 4 5 6 7 8   digits      GP2 .. GP11
+ - * /               operators   GP12 .. GP15
EXE                   equals      GP16
C                     clear entry GP17   (Pico pin 22)
AC                    clear all   GP18   (Pico pin 24)
```

Header numbering and GPIO numbering are different coordinate systems:
**physical pin 22 is GP17**. Check which one someone means before wiring.

## How it differs from `70-calculator`

- **`C` clears the whole entry.** The other version turns that key into a
  **backspace** that drops one digit at a time.
- **Every OLED verb flushes.** This program never says `oled show`, so the
  generator emits the draw-and-flush driver: each `oled clear` and each
  `oled print` pushes a full 128×64 frame — a 1 KB I²C transfer — and a screen
  built from six verbs sends six of them per keypress. That is exactly the
  behaviour `oled show` was added to fix, which makes this program the
  reference for what the buffered driver replaced.

Neither difference is a defect here. This is the simpler program, and it is
the one to read first.

## Try it

`5` `+` `3` `EXE` shows **8**. The pending operand and operator appear on the
upper line while an operation is waiting; `C` resets what you are typing,
`AC` resets everything.
