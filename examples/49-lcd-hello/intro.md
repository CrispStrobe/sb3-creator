## What you see
A 16×2 character LCD with an I2C backpack: two wires (SDA on P2.1, SCL on P2.2) carry everything the display shows. The first row greets you; the second row counts up once a second.

## Try this
1. Run the program — watch "HELLO BRICKWRIGHT" appear, then the counter tick.
2. Open the Code tab and change the greeting text.
3. Real bench fact: I2C needs the two pull-up resistors you see — the bus lines only ever pull LOW; the resistors make the HIGH.
