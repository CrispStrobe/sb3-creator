# LCD1602 direkt am 8051

Eine allgemeine schreibgeschützte HD44780/LCD1602-Schaltung ohne
I²C-Backpack. D4–D7 kommen an P1.4–P1.7, RS an P2.0, EN an P2.1; RW
wird mit GND verbunden. `WRITE ONLY` bedeutet, dass RW keinen MCU-Pin
belegt.

