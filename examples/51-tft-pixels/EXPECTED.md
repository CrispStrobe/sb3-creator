# Expected behavior
- On run, the TFT face starts black (tft clear).
- Three rectangles appear: red at (10,10), green at (70,130), blue at (130,250).
- A single white pixel appears at (120,160).
- The debugger's pin panel shows SPI activity on P1.0-P1.3 during each draw command.
- Engine-level: the ILI9341 device model's GRAM receives CASET+PASET+RAMWR sequences with RGB565 pixel data.
