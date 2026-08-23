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
- **Polarity lesson:** setting the matrix's `colActiveHigh` to `true` and `rowActiveHigh` to
  `false` in the circuit — the 788BS common-cathode wiring — inverts both column and row
  polarity, and every LED glows dimly instead of showing a crisp pattern. Those two params
  are the ones the engine reads; the part number itself is not a simulated field.

## What this verifies

1. Column-scanning multiplexing: 16 pins (8 columns + 8 rows) drive 64 LEDs
2. Active-low columns, active-high rows for the 788AS common-anode matrix
3. Button-driven pattern scrolling
4. Polarity matters: inverted `colActiveHigh`/`rowActiveHigh` produce a uniformly dim display

```assert
# Supply rail: VCC = 5.0V
net vcc1.vcc V 5.00 +-0.01
```
