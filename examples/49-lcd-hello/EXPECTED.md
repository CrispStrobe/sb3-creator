# Expected behavior
- On run, the LCD face shows `HI BRICKWRIGHT` on row 1 within the first second.
- Row 2 shows `COUNT: 0`, then `COUNT: 1`, incrementing every ~1 s.
- The debugger's pin panel shows activity bursts on P2.1/P2.2 during each print (bit-banged I2C).
- Engine-level: `board.getDeviceState('lcd1').display` returns the two row strings; backlight stays true.
