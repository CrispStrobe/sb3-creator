# OLED am Pico

Das **GME12864-70** OLED (SSD1306, 128×64, Weiß/Blau, 4 Pins) am
Raspberry Pi Pico, verdrahtet wie in jedem Tutorial: **Board-Pin 1 =
GP0 = SDA, Board-Pin 2 = GP1 = SCL**, dazu VCC und GND — vier Drähte
zum Display.

Das Programm bit-bangt I²C über die beiden GPIOs und schreibt Text.
Nach dem Start zeigt das Panel HELLO FROM PICO. Die Onboard-LED des
Pico (GP25) ist ohne jede Verdrahtung auf der Werkbank — sie ist auf
der Platine verlötet, genau wie beim echten Board.
