# LCD1602 directly on an 8051

A generic write-only HD44780/LCD1602 circuit without an I²C backpack.
Connect D4–D7 to P1.4–P1.7, RS to P2.0, EN to P2.1, and tie RW to GND.
The `WRITE ONLY` declaration tells BrickWright there is no MCU RW pin.

