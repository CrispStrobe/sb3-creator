---
level: advanced
age: 14+
prereqs: [arduino-01-blink, arduino-05-for-loop]
teaches: [multiplexing, led-matrix, polarity, column-scanning, attiny88]
---
## What you see
A pendant badge with an ATtiny88 microcontroller driving a bare 8×8 LED matrix (788AS) through column scanning. Two buttons scroll a smiley pattern left and right. This is the same architecture as the blinkenrocket LED badge, rebuilt from scratch with our own firmware.

## Try this
1. Run the program — the smiley pattern appears on the matrix.
2. Press the left/right buttons to scroll the pattern.
3. **The polarity lesson:** change the matrix variant from "788AS" to "788BS" in the circuit. Now every LED glows dimly instead of showing a pattern — because the column and row polarity are both wrong. The 788AS has columns active LOW and rows active HIGH; the 788BS has the opposite. Wrong polarity means every LED gets a weak forward current through the wrong path.

## What is going on
An 8×8 matrix has 64 LEDs but only 16 pins (8 columns + 8 rows). To light a specific LED, you **select its column** and **drive its row**. The trick: only one column is active at a time, but scanning through all 8 columns fast enough (>100 Hz) makes them all appear lit simultaneously — this is **multiplexing**.

For the 788AS variant: column LOW selects (cathode side), row HIGH lights (anode side). The firmware turns all columns HIGH (deselected), sets the row pattern, then pulls ONE column LOW for 2 ms before moving to the next. Each column gets 1/8 of the time, so the LEDs are dimmer than DC — but 8× the current per LED compensates.

## Why it matters
Multiplexing is the standard technique for driving LED displays, seven-segment digits, and keypads. Every traffic sign, LED billboard, and calculator display uses it. Understanding which pin is the anode and which is the cathode (the AS/BS polarity) is the first lesson — get it wrong and the display either doesn't work or glows uniformly dim.

## Go further
- Change the pattern data to display a letter or your initials.
- Add a third pattern and cycle through them with the buttons.
- Try different scan speeds: too slow and you see flicker, too fast and the LEDs get dim.
