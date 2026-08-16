## TFT Colour Display

An **ILI9341** is a 240 x 320 pixel colour TFT driven over SPI.
Four pins carry the entire bus: **CS** (chip select), **DC** (data/command), **SCK** (clock) and **MOSI** (data out).

This example clears the screen to black, then draws three coloured rectangles (red, green, blue) and a single white pixel at the centre.

### Verbs

| Verb | What it does |
|------|-------------|
| `tft clear D` | Fill the whole screen with black |
| `tft fill X Y W H R r G g B b on D` | Fill a rectangle at (X, Y), size W x H, colour (r, g, b) |
| `tft pixel X Y R r G g B b on D` | Set a single pixel at (X, Y) to colour (r, g, b) |

Colours are 0-255 per channel; the driver converts to RGB565 on the wire.
