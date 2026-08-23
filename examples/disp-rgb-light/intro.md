---
level: beginner
age: 8+
teaches: [neopixel, rgb, color-mixing, ws2812]
---
## What you see
Three NeoPixel (WS2812) RGB LEDs cycling through colours. Each pixel
shifts its colour components, creating a flowing rainbow effect.

## Try this
1. Run the program — three LEDs cycle through shifting colours.
2. Change `set neopixel 0 r g b` to fixed values like `set neopixel 0 255 0 0`
   for solid red.
3. Add more pixels: `set neopixel 3 ...` extends the strip.

## What is going on
NeoPixels are addressable RGB LEDs on a single data line. Each pixel has
8-bit red, green, and blue channels (0–255). `set neopixel N R G B on 1`
sets pixel N's colour. The program shifts RGB values each tick to create
a smooth colour cycle.

## Why it matters
Addressable LEDs are used for status indicators, decorative lighting, and
displays. Understanding RGB colour mixing (red + green = yellow, red + blue
= magenta) is fundamental to working with any colour display.
