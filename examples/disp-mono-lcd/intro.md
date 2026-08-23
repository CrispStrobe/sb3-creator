---
level: beginner
age: 10+
teaches: [mono-lcd, i2c, display, graphics]
---
## What you see
A monochrome graphic LCD (128×64 pixels) showing text and a frame counter.
The SSD1306 chip drives both OLED and LCD panels — this demo uses it as a
monochrome LCD faceplate.

## Try this
1. Run the program — "MONO LCD" on top, frame counter incrementing.
2. Use `oled pixel x y 1 on 1` to draw individual pixels.
3. Clear and redraw for simple animations.

## What is going on
Same I²C protocol as the OLED demo — the SSD1306 controller doesn't care
whether the panel is OLED or LCD. `oled clear`, `oled cursor`, `oled print`
all work identically. The faceplate widget renders with LCD-style contrast.
