# blinkenrocket-pendant — expected behaviour

## Circuit

ATtiny88 driving an 8x8 LED matrix (788AS, common-anode columns active-low, common-cathode rows active-high). Two buttons on PC3 and PC7 with 10 kohm pull-downs.

## Program

Column-scans two HEART frames, big and small, alternating to give a heartbeat.
For each column the program turns on exactly that column's rows, strobes the
column for 2 ms, and turns the same rows back off; 20 scan passes hold each
frame for about 0.32 s. The matrix is multiplexed — only one column is
energised at a time — but scanning all eight fast enough makes the whole image
look solid.

The frames the program actually paints, read back out of it column by column:

    big heart          small heart
    . . . . . . . .    . . . . . . . .
    . ##  . . ##  .    . . . . . . . .
    ################   . .##. . ##. .
    ################   .############.
    ################   .############.
    .############.     . .########. .
    . .########. .     . . .####. . .
    . . .####. . .     . . . . . . . .

Row 0 is deliberately unlit: neither heart reaches the top row, so `row0` is
declared for the wiring and never driven.

## Observable behaviour

- **Start:** a heart beats on the matrix — the big frame and the small frame
  alternate about every third of a second.
- **Either button (PC3 or PC7):** held down, it adds a 0.2 s pause at the end of
  each frame, so the beat slows. Neither button scrolls anything.
- The display looks like a continuous image despite one-column-at-a-time scanning.
- **Polarity lesson:** setting the matrix's `colActiveHigh` to `true` and `rowActiveHigh` to
  `false` in the circuit — the 788BS common-cathode wiring — inverts both column and row
  polarity, and every LED glows dimly instead of showing a crisp pattern. Those two params
  are the ones the engine reads; the part number itself is not a simulated field.

## What this verifies

1. Column-scanning multiplexing: 16 pins (8 columns + 8 rows) drive 64 LEDs
2. Active-low columns, active-high rows for the 788AS common-anode matrix
3. Button-driven timing: reading an INPUT pin changes the frame rate
4. Polarity matters: inverted `colActiveHigh`/`rowActiveHigh` produce a uniformly dim display

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
