# OLED on the Pico

The **GME12864-70** OLED (SSD1306, 128×64, white/blue, 4 pins) on a
Raspberry Pi Pico, wired the way every tutorial wires it: **board
pin 1 = GP0 = SDA, board pin 2 = GP1 = SCL**, plus VCC and GND —
four wires to a display.

The program bit-bangs I²C from the two GPIOs and prints text. Run it
and the panel says HELLO FROM PICO. The Pico's onboard LED (GP25)
also exists on the bench without any wiring — it is soldered to the
board, exactly like the real one.
