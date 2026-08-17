## OLED Display

An **SSD1306** is a 128 x 64 pixel monochrome OLED driven over I2C.
Two pins carry the bus: **SDA** (data) and **SCL** (clock), both open-drain with 4.7 k pull-up resistors to VCC.

This example clears the screen, prints "HI BRICKWRIGHT" on page 0, then counts on page 1, incrementing every second.

### Verbs

| Verb | What it does |
|------|-------------|
| `oled clear D` | Zero the entire 128 x 64 display |
| `oled print TEXT on D` | Print text at the current cursor position (5 x 7 font, 21 chars per row) |
| `oled set cursor ROW COL on D` | Move the cursor to page ROW (0-7), character column COL (0-20) |
| `oled pixel X Y VALUE on D` | Set a single pixel at (X, Y) — VALUE is 1 (on) or 0 (off) |

### Open-drain lesson

The STC12's port pins are quasi-bidirectional: they can sink 20 mA but source only ~230 uA.
I2C needs the bus to be pulled HIGH between transactions.
Without the 4.7 k resistors, the bus floats LOW and no device responds.
