# blinkenrocket-pendant — expected behaviour

## Circuit

ATtiny88 driving an 8x8 LED matrix (788AS, common-anode columns active-low, common-cathode rows active-high). Two buttons on PC3 and PC7 with 10 kohm pull-downs.

## Program

Column-scans a smiley face pattern across the 8x8 matrix. Two buttons scroll the pattern left and right. The matrix is multiplexed: only one column is energised at a time, but scanning all 8 fast enough makes the full image appear solid.

## Observable behaviour

- **Start:** an 8x8 smiley face pattern appears on the LED matrix.
- **Left button (PC3):** pattern scrolls left.
- **Right button (PC7):** pattern scrolls right.
- The display looks like a continuous image despite one-column-at-a-time scanning.
- **Polarity lesson:** changing the matrix variant from 788AS to 788BS in the circuit causes every LED to glow dimly instead of showing a crisp pattern — both column and row polarity are inverted.

## What this verifies

1. Column-scanning multiplexing: 16 pins (8 columns + 8 rows) drive 64 LEDs
2. Active-low columns, active-high rows for the 788AS common-anode matrix
3. Button-driven pattern scrolling
4. Polarity matters: wrong matrix type produces a uniformly dim display
