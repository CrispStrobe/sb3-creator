# PRECHIN A2 learning board

This example exposes the measured PRECHIN A2 wiring as one circuit: its
STC89C52RC, 74HC595-driven 8×8 matrix, keypad, eight-digit display, active-low
LED row, ET/XPT2046 ADC, DS1302, DS18B20, AT24C02, LCD1602, IR receiver,
buzzer, keys and analogue sensors.

It is intentionally dense. The value is seeing the shared nets and
jumper-dependent conflicts which a small demonstration circuit normally hides.
Before enabling a peripheral, trace its nets and check which other device owns
the same pins. The circuit was generated and bench-verified in
`bw-circuit-ui` at revision
`75e3058bd2481faebe8d8272dbbc74cee06cd0dc`.

There is no bundled program. Use the board as a wiring reference or copy it as
the starting point for a focused A2 experiment.
