# YL-39 minimum system

This is the complete YL-39 learning-board wiring as one inspectable circuit,
not a simplified blink setup. It combines the STC89C52RC, eight active-low
LEDs on P1, four buttons on P3.2–P3.5, the P2.3 buzzer, potentiometer input and
the four-digit display driven through a 74HC595.

Use it to trace a real board before writing software: select a part, follow its
net to the MCU, and compare shared pins before enabling two peripherals at
once. The circuit was generated and verified in `bw-circuit-ui` at revision
`75e3058bd2481faebe8d8272dbbc74cee06cd0dc`.

There is no program in this example. It is a board-level wiring reference and
a starting point for experiments.
